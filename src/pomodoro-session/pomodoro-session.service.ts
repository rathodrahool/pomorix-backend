import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { StartPomodoroDto } from './dto/start-pomodoro.dto';
import { PomodoroSessionState } from '@prisma/client';
import { MESSAGE } from 'src/common/response-messages';

@Injectable()
export class PomodoroSessionService {
    constructor(private readonly prisma: PrismaService) { }

    async start(userId: string, dto: StartPomodoroDto) {
        // Business Rule 1: Check if user has an active task
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

        // Business Rule 2: Check if there's already an active session
        const existingSession = await this.prisma.pomodoro_sessions.findFirst({
            where: {
                user_id: userId,
                state: {
                    in: [PomodoroSessionState.FOCUS, PomodoroSessionState.BREAK],
                },
            },
        });

        if (existingSession) {
            throw new BadRequestException(MESSAGE.ERROR.POMODORO.ACTIVE_SESSION_EXISTS);
        }

        // Create new session
        const session = await this.prisma.pomodoro_sessions.create({
            data: {
                user_id: userId,
                task_id: activeTask.id,
                state: PomodoroSessionState.FOCUS,
                focus_duration_seconds: dto.focus_duration_seconds,
                break_duration_seconds: dto.break_duration_seconds,
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
            state: session.state,
            focus_duration_seconds: session.focus_duration_seconds,
            break_duration_seconds: session.break_duration_seconds,
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

        // Determine duration based on current state
        const totalDuration = session.state === PomodoroSessionState.FOCUS
            ? session.focus_duration_seconds
            : session.break_duration_seconds;

        const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);

        return {
            session_id: session.id,
            task_id: session.task_id,
            task_title: session.task.title,
            state: session.state,
            focus_duration_seconds: session.focus_duration_seconds,
            break_duration_seconds: session.break_duration_seconds,
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
}
