import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { format, parseISO, differenceInDays } from 'date-fns';
import type { StreakResponseDto } from './dto/streak-response.dto';
import type { TotalStatsResponseDto } from './dto/total-stats-response.dto';
import { PomodoroSessionState, SessionType } from '@prisma/client';

@Injectable()
export class StreakService {
    constructor(private readonly prisma: PrismaService) { }

    async getStreak(userId: string): Promise<StreakResponseDto> {
        // Get or initialize user streak
        let userStreak = await this.prisma.user_streaks.findUnique({
            where: { user_id: userId },
        });

        // If streak doesn't exist, initialize with defaults
        if (!userStreak) {
            userStreak = await this.prisma.user_streaks.create({
                data: { user_id: userId },
            });
        }

        // Check if streak is broken (user skipped a day)
        let currentStreak = userStreak.current_streak;

        if (userStreak.last_active_date) {
            const today = new Date();
            const todayDate = parseISO(format(today, 'yyyy-MM-dd'));
            const daysSinceLastActive = differenceInDays(
                todayDate,
                userStreak.last_active_date,
            );

            // If last active was more than 1 day ago, streak is broken
            if (daysSinceLastActive > 1) {
                currentStreak = 0;
            }
        }

        return {
            current_streak: currentStreak,
            longest_streak: userStreak.longest_streak,
            last_active_date: userStreak.last_active_date
                ? format(userStreak.last_active_date, 'yyyy-MM-dd')
                : null,
        };
    }

    async getTotalStats(userId: string): Promise<TotalStatsResponseDto> {
        // Get all completed focus sessions for the user
        const completedSessions = await this.prisma.pomodoro_sessions.findMany({
            where: {
                user_id: userId,
                session_type: SessionType.FOCUS,
                state: PomodoroSessionState.COMPLETED,
            },
            select: {
                started_at: true,
                ended_at: true,
                total_pause_seconds: true,
            },
        });

        // Calculate total pomodoros
        const totalPomodoros = completedSessions.length;

        // Calculate total time spent in seconds
        const totalSeconds = completedSessions.reduce((total, session) => {
            if (session.ended_at && session.started_at) {
                // Calculate actual time spent: (end - start) - pauses
                const sessionDurationMs =
                    session.ended_at.getTime() - session.started_at.getTime();
                const sessionDurationSeconds = Math.floor(sessionDurationMs / 1000);
                const actualSeconds =
                    sessionDurationSeconds - session.total_pause_seconds;
                return total + actualSeconds;
            }
            return total;
        }, 0);

        // Convert to hours and minutes
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Number((totalSeconds / 3600).toFixed(2));

        return {
            total_pomodoros: totalPomodoros,
            total_hours: totalHours,
            total_minutes: totalMinutes,
        };
    }

    async handleSessionCompleted(
        userId: string,
        sessionEndTime: Date,
        userTimezone: string = 'UTC',
    ): Promise<void> {
        // Step 1: Resolve user's local date
        const activityDate = this.getUserLocalDate(sessionEndTime, userTimezone);

        // Step 2: Upsert daily_activity (idempotent)
        await this.prisma.daily_activity.upsert({
            where: {
                user_id_activity_date: {
                    user_id: userId,
                    activity_date: activityDate,
                },
            },
            update: {
                pomodoro_count: {
                    increment: 1,
                },
            },
            create: {
                user_id: userId,
                activity_date: activityDate,
                pomodoro_count: 1,
            },
        });

        // Step 3: Update streak
        await this.updateStreak(userId, activityDate);
    }

    // Helper Methods
    private async updateStreak(userId: string, activityDate: Date): Promise<void> {
        // Get or create user streak
        let userStreak = await this.prisma.user_streaks.findUnique({
            where: { user_id: userId },
        });

        if (!userStreak) {
            userStreak = await this.prisma.user_streaks.create({
                data: { user_id: userId },
            });
        }

        // Calculate new streak
        let newCurrentStreak = 1;

        if (userStreak.last_active_date) {
            const daysDifference = differenceInDays(
                activityDate,
                userStreak.last_active_date,
            );

            if (daysDifference === 0) {
                // Same day - no change to streak
                return;
            } else if (daysDifference === 1) {
                // Consecutive day - increment
                newCurrentStreak = userStreak.current_streak + 1;
            } else {
                // Gap - reset to 1 (user is back today, starting fresh)
                newCurrentStreak = 1;
            }
        }

        // Update longest streak if needed
        const newLongestStreak = Math.max(
            userStreak.longest_streak,
            newCurrentStreak,
        );

        // Save updated streak
        await this.prisma.user_streaks.update({
            where: { user_id: userId },
            data: {
                current_streak: newCurrentStreak,
                longest_streak: newLongestStreak,
                last_active_date: activityDate,
            },
        });
    }

    private getUserLocalDate(timestamp: Date, timezone: string): Date {
        // For MVP, we use the date as-is
        // In production, use timezone libraries to convert to user's local date
        // Example with date-fns-tz:
        // const zonedDate = utcToZonedTime(timestamp, timezone);
        // return startOfDay(zonedDate);

        // For now, extract date portion (assuming timestamp is already user-local)
        const dateString = format(timestamp, 'yyyy-MM-dd');
        return parseISO(dateString);
    }
}
