import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { StartPomodoroDto } from './dto/start-pomodoro.dto';
import { PomodoroSessionState } from '@prisma/client';

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
            throw new BadRequestException('No active task found. Please set a task as active first.');
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
            throw new BadRequestException('An active Pomodoro session already exists. Please complete or abort it first.');
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
}
