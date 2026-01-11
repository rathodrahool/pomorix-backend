import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalFeedQueryDto, GlobalFeedResponseDto } from './dto/global-feed.dto';
import { OnlineCountResponseDto } from './dto/online-count.dto';
import { PomodoroSessionState } from '@prisma/client';

@Injectable()
export class GlobalService {
    constructor(private readonly prisma: PrismaService) { }

    async getGlobalFeed(query: GlobalFeedQueryDto): Promise<GlobalFeedResponseDto> {
        const { limit } = query;

        // Define the "active window" (5 minutes ago)
        const activeThreshold = new Date(Date.now() - 5 * 60 * 1000);

        // Fetch active sessions
        const sessions = await this.prisma.pomodoro_sessions.findMany({
            where: {
                OR: [
                    {
                        // Currently in FOCUS or BREAK state
                        state: {
                            in: [PomodoroSessionState.FOCUS, PomodoroSessionState.BREAK],
                        },
                    },
                    {
                        // Recently completed (within last 2 minutes)
                        ended_at: {
                            gte: activeThreshold,
                        },
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                task: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                updated_at: 'desc',
            },
            take: limit,
        });

        // Count distinct online users
        const onlineUsers = await this.prisma.pomodoro_sessions.findMany({
            where: {
                state: {
                    in: [PomodoroSessionState.FOCUS, PomodoroSessionState.BREAK],
                },
                ended_at: null,
                updated_at: {
                    gte: activeThreshold,
                },
            },
            select: {
                user_id: true,
            },
            distinct: ['user_id'],
        });

        const online_count = onlineUsers.length;

        // Return raw database data - let frontend handle presentation
        const items = sessions.map((session) => ({
            user: {
                id: session.user.id,
                email: session.user.email,
            },
            task: {
                id: session.task_id,
                title: session.task.title,
            },
            session: {
                state: session.state,
                ended_at: session.ended_at,
                updated_at: session.updated_at,
            },
        }));

        return {
            online_count,
            items,
        };
    }

    async getOnlineCount(): Promise<OnlineCountResponseDto> {
        // Define the "active window" (5 minutes ago)
        const activeThreshold = new Date(Date.now() - 5 * 60 * 1000);

        // Count distinct online users
        const onlineUsers = await this.prisma.pomodoro_sessions.findMany({
            where: {
                state: {
                    in: [PomodoroSessionState.FOCUS, PomodoroSessionState.BREAK],
                },
                ended_at: null,
                updated_at: {
                    gte: activeThreshold,
                },
            },
            select: {
                user_id: true,
            },
            distinct: ['user_id'],
        });

        return {
            online_count: onlineUsers.length,
        };
    }
}
