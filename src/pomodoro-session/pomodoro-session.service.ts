import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { StartPomodoroDto } from './dto/start-pomodoro.dto';
import { PomodoroSessionState, SessionType } from '@prisma/client';
import { MESSAGE } from 'src/common/response-messages';
import { StreakService } from 'src/streak/streak.service';
import { BadgeService } from 'src/badge/badge.service';

@Injectable()
export class PomodoroSessionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly streakService: StreakService,
        private readonly badgeService: BadgeService,
    ) { }

    async start(userId: string, dto: StartPomodoroDto) {
        // Business Rule 1: Check if user has an active task (only for FOCUS sessions)
        if (dto.session_type === SessionType.FOCUS) {
            const activeTask = await this.prisma.tasks.findFirst({
                where: {
                    user_id: userId,
                    is_active: true,
                    deleted_at: null,
                },
            });

            if (!activeTask) {
                throw new BadRequestException(MESSAGE.ERROR.POMODORO.NO_ACTIVE_TASK);
            }
        }

        // Business Rule 2: If switching sessions, abort the previous one
        const existingSession = await this.prisma.pomodoro_sessions.findFirst({
            where: {
                user_id: userId,
                state: {
                    in: [PomodoroSessionState.FOCUS, PomodoroSessionState.BREAK],
                },
            },
        });

        // If there's an active session, abort it (user is switching)
        if (existingSession) {
            const now = new Date();
            let totalPauseSeconds = existingSession.total_pause_seconds;

            // If it was paused, add the final pause duration
            if (existingSession.paused_at) {
                const pausedAt = new Date(existingSession.paused_at);
                const pauseDuration = Math.floor((now.getTime() - pausedAt.getTime()) / 1000);
                totalPauseSeconds += pauseDuration;
            }

            await this.prisma.pomodoro_sessions.update({
                where: { id: existingSession.id },
                data: {
                    state: PomodoroSessionState.ABORTED,
                    ended_at: now,
                    paused_at: null,
                    total_pause_seconds: totalPauseSeconds,
                },
            });
        }

        // Get user settings to determine duration
        const userSettings = await this.getUserSettings(userId);
        const duration = this.getDurationForSessionType(dto.session_type, userSettings);

        // Determine state based on session type
        const state = dto.session_type === SessionType.FOCUS
            ? PomodoroSessionState.FOCUS
            : PomodoroSessionState.BREAK;

        // Get active task for FOCUS sessions, or any task for BREAK sessions
        const task = await this.getTaskForSession(userId, dto.session_type);

        if (!task) {
            throw new BadRequestException(
                dto.session_type === SessionType.FOCUS
                    ? MESSAGE.ERROR.POMODORO.NO_ACTIVE_TASK
                    : MESSAGE.ERROR.POMODORO.NO_TASKS_FOUND
            );
        }

        // Create new session
        const session = await this.prisma.pomodoro_sessions.create({
            data: {
                user_id: userId,
                task_id: task.id,
                session_type: dto.session_type,
                state: state,
                duration_seconds: duration,
                started_at: new Date(),
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        return {
            session_id: session.id,
            task_id: session.task_id,
            task_title: session.task.title,
            session_type: session.session_type,
            state: session.state,
            duration_seconds: session.duration_seconds,
            started_at: session.started_at,
        };
    }

    async getCurrent(userId: string) {
        // Find active session (focus or break state)
        const session = await this.prisma.pomodoro_sessions.findFirst({
            where: {
                user_id: userId,
                state: {
                    in: [PomodoroSessionState.FOCUS, PomodoroSessionState.BREAK],
                },
            },
            include: {
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        if (!session) {
            return null;
        }

        // Calculate remaining time
        const now = new Date();
        const startedAt = new Date(session.started_at);

        // Calculate elapsed time (excluding pauses)
        let elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

        // Subtract total pause time
        elapsedSeconds -= session.total_pause_seconds;

        // If currently paused, don't count time since pause
        if (session.paused_at) {
            const pausedAt = new Date(session.paused_at);
            const pausedDuration = Math.floor((now.getTime() - pausedAt.getTime()) / 1000);
            elapsedSeconds -= pausedDuration;
        }

        const remainingSeconds = Math.max(0, session.duration_seconds - elapsedSeconds);

        return {
            session_id: session.id,
            task_id: session.task_id,
            task_title: session.task.title,
            session_type: session.session_type,
            state: session.state,
            duration_seconds: session.duration_seconds,
            started_at: session.started_at,
            paused_at: session.paused_at,
            is_paused: session.paused_at !== null,
            remaining_seconds: remainingSeconds,
            elapsed_seconds: elapsedSeconds,
        };
    }

    async pause(userId: string) {
        // Find active session
        const session = await this.prisma.pomodoro_sessions.findFirst({
            where: {
                user_id: userId,
                state: {
                    in: [PomodoroSessionState.FOCUS, PomodoroSessionState.BREAK],
                },
            },
        });

        if (!session) {
            throw new BadRequestException(MESSAGE.ERROR.POMODORO.NO_ACTIVE_SESSION);
        }

        // Check if already paused
        if (session.paused_at) {
            throw new BadRequestException(MESSAGE.ERROR.POMODORO.ALREADY_PAUSED);
        }

        // Pause the session by setting paused_at timestamp
        await this.prisma.pomodoro_sessions.update({
            where: { id: session.id },
            data: {
                paused_at: new Date(),
            },
        });
    }

    async resume(userId: string) {
        // Find active session
        const session = await this.prisma.pomodoro_sessions.findFirst({
            where: {
                user_id: userId,
                state: {
                    in: [PomodoroSessionState.FOCUS, PomodoroSessionState.BREAK],
                },
            },
        });

        if (!session) {
            throw new BadRequestException(MESSAGE.ERROR.POMODORO.NO_ACTIVE_SESSION);
        }

        // Check if session is paused
        if (!session.paused_at) {
            throw new BadRequestException(MESSAGE.ERROR.POMODORO.NOT_PAUSED);
        }

        // Calculate pause duration
        const now = new Date();
        const pausedAt = new Date(session.paused_at);
        const pauseDurationSeconds = Math.floor((now.getTime() - pausedAt.getTime()) / 1000);

        // Resume by clearing paused_at and adding to total_pause_seconds
        await this.prisma.pomodoro_sessions.update({
            where: { id: session.id },
            data: {
                paused_at: null,
                total_pause_seconds: session.total_pause_seconds + pauseDurationSeconds,
            },
        });
    }

    async complete(userId: string) {
        // Find active session
        const session = await this.prisma.pomodoro_sessions.findFirst({
            where: {
                user_id: userId,
                state: {
                    in: [PomodoroSessionState.FOCUS, PomodoroSessionState.BREAK],
                },
            },
            include: {
                task: true, // Include task to check estimation
            },
        });

        if (!session) {
            throw new BadRequestException(MESSAGE.ERROR.POMODORO.NO_ACTIVE_SESSION);
        }

        // 1. Mark session as completed
        const now = new Date();
        let totalPauseSeconds = session.total_pause_seconds;

        // If currently paused, add the final pause duration to total_pause_seconds
        if (session.paused_at) {
            const pausedAt = new Date(session.paused_at);
            const pauseDuration = Math.floor((now.getTime() - pausedAt.getTime()) / 1000);
            totalPauseSeconds += Math.max(0, pauseDuration);
        }

        // Use transaction to ensure atomicity
        await this.prisma.$transaction(async (tx) => {
            // Update session
            await tx.pomodoro_sessions.update({
                where: { id: session.id },
                data: {
                    state: PomodoroSessionState.COMPLETED,
                    ended_at: now,
                    paused_at: null,
                    total_pause_seconds: totalPauseSeconds,
                },
            });

            // 2. Only increment completed_pomodoros for FOCUS sessions
            if (session.session_type === SessionType.FOCUS) {
                const updatedTask = await tx.tasks.update({
                    where: { id: session.task_id },
                    data: {
                        completed_pomodoros: {
                            increment: 1,
                        },
                    },
                });

                // 3. Auto-complete task if estimation is met
                const newCompletedCount = updatedTask.completed_pomodoros;
                if (
                    updatedTask.estimated_pomodoros &&
                    newCompletedCount >= updatedTask.estimated_pomodoros
                ) {
                    await tx.tasks.update({
                        where: { id: session.task_id },
                        data: {
                            is_completed: true,
                            is_active: false, // Deactivate completed task
                        },
                    });

                    // 4. Auto-activate the next incomplete task
                    const nextTask = await tx.tasks.findFirst({
                        where: {
                            user_id: userId,
                            deleted_at: null,
                            is_completed: false,
                        },
                        orderBy: {
                            created_at: 'asc', // FIFO: oldest first
                        },
                    });

                    if (nextTask) {
                        await tx.tasks.update({
                            where: { id: nextTask.id },
                            data: { is_active: true },
                        });
                    }
                }
            }
        });

        // Emit SESSION_COMPLETED event for streak module (only for FOCUS sessions)
        if (session.session_type === SessionType.FOCUS) {
            await this.streakService.handleSessionCompleted(
                userId,
                new Date(),
                'UTC', // TODO: Get user's actual timezone from settings
            );

            // Check and award badges after streak update
            await this.badgeService.checkAndAwardBadges(userId);
        }
    }

    // Helper Methods
    private async getUserSettings(userId: string) {
        let userSettings = await this.prisma.user_settings.findUnique({
            where: { user_id: userId },
        });

        // If user settings don't exist, create with defaults
        if (!userSettings) {
            userSettings = await this.prisma.user_settings.create({
                data: { user_id: userId },
            });
        }

        return userSettings;
    }

    private getDurationForSessionType(type: SessionType, settings: any): number {
        switch (type) {
            case SessionType.FOCUS:
                return settings.pomodoro_duration * 60; // Convert minutes to seconds
            case SessionType.SHORT_BREAK:
                return settings.short_break * 60;
            case SessionType.LONG_BREAK:
                return settings.long_break * 60;
            default:
                return settings.pomodoro_duration * 60;
        }
    }

    private async getTaskForSession(userId: string, sessionType: SessionType) {
        if (sessionType === SessionType.FOCUS) {
            // For FOCUS sessions, get the active task
            return await this.prisma.tasks.findFirst({
                where: {
                    user_id: userId,
                    is_active: true,
                    deleted_at: null,
                },
            });
        } else {
            // For BREAK sessions, get the active task or any task (breaks don't strictly require a task)
            const activeTask = await this.prisma.tasks.findFirst({
                where: {
                    user_id: userId,
                    is_active: true,
                    deleted_at: null,
                },
            });

            if (activeTask) return activeTask;

            // If no active task, get the most recent task
            return await this.prisma.tasks.findFirst({
                where: {
                    user_id: userId,
                    deleted_at: null,
                },
                orderBy: {
                    created_at: 'desc',
                },
            });
        }
    }
}

