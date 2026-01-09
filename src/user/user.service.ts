import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PomodoroSessionState, SessionType } from '@prisma/client';
import { format } from 'date-fns';
import type { ProfileResponseDto, DailyBreakdownDto } from './dto/profile-response.dto';
import { AnalyticsRange } from './dto/analytics-range.dto';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(userId: string, range: AnalyticsRange = AnalyticsRange.LAST_7_DAYS): Promise<ProfileResponseDto> {
        // Parallel queries for better performance
        const [user, userStreak, userSettings, lifetimeStats, analytics] = await Promise.all([
            this.getUserInfo(userId),
            this.getStreakInfo(userId),
            this.getUserSettings(userId),
            this.getLifetimeStats(userId),
            this.getAnalytics(userId, range),
        ]);

        // Calculate daily goal in hours
        const dailyGoalHours = userSettings.daily_goal_pomodoros * (userSettings.pomodoro_duration / 60);

        return {
            user,
            lifetime_stats: lifetimeStats,
            streak: userStreak,
            analytics: {
                ...analytics,
                daily_goal_hours: Number(dailyGoalHours.toFixed(2)),
            },
        };
    }

    private async getUserInfo(userId: string) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                created_at: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Extract username from email (e.g., "john.doe@example.com" → "JohnDoe")
        const username = this.extractUsername(user.email);

        return {
            id: user.id,
            email: user.email,
            username,
            member_since: user.created_at.toISOString(),
        };
    }

    private async getStreakInfo(userId: string) {
        let userStreak = await this.prisma.user_streaks.findUnique({
            where: { user_id: userId },
        });

        // Initialize if doesn't exist
        if (!userStreak) {
            userStreak = await this.prisma.user_streaks.create({
                data: { user_id: userId },
            });
        }

        return {
            current_streak: userStreak.current_streak,
            longest_streak: userStreak.longest_streak,
            last_active_date: userStreak.last_active_date
                ? format(userStreak.last_active_date, 'yyyy-MM-dd')
                : null,
        };
    }

    private async getUserSettings(userId: string) {
        let settings = await this.prisma.user_settings.findUnique({
            where: { user_id: userId },
        });

        // Initialize with defaults if doesn't exist
        if (!settings) {
            settings = await this.prisma.user_settings.create({
                data: { user_id: userId },
            });
        }

        return settings;
    }

    private async getLifetimeStats(userId: string) {
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

        const totalPomodoros = completedSessions.length;

        const totalSeconds = completedSessions.reduce((total, session) => {
            if (session.ended_at && session.started_at) {
                const sessionDurationMs = session.ended_at.getTime() - session.started_at.getTime();
                const sessionDurationSeconds = Math.floor(sessionDurationMs / 1000);
                const actualSeconds = sessionDurationSeconds - session.total_pause_seconds;
                return total + actualSeconds;
            }
            return total;
        }, 0);

        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Number((totalSeconds / 3600).toFixed(2));

        return {
            total_sessions: totalPomodoros,
            total_hours: totalHours,
            total_minutes: totalMinutes,
            total_pomodoros: totalPomodoros,
        };
    }

    private async getAnalytics(userId: string, range: AnalyticsRange) {
        const { startDate, endDate, daysInRange } = this.getDateRange(range);

        // Current period sessions
        const currentSessions = await this.prisma.pomodoro_sessions.findMany({
            where: {
                user_id: userId,
                session_type: SessionType.FOCUS,
                state: PomodoroSessionState.COMPLETED,
                started_at: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                started_at: true,
                ended_at: true,
                total_pause_seconds: true,
            },
        });

        // Calculate focus time for current period
        const currentFocusSeconds = this.calculateTotalFocusTime(currentSessions);
        const currentFocusHours = Number((currentFocusSeconds / 3600).toFixed(2));

        // Calculate previous period for percentage change
        const { startDate: prevStartDate, endDate: prevEndDate } = this.getPreviousDateRange(range);
        const previousSessions = await this.prisma.pomodoro_sessions.findMany({
            where: {
                user_id: userId,
                session_type: SessionType.FOCUS,
                state: PomodoroSessionState.COMPLETED,
                started_at: {
                    gte: prevStartDate,
                    lte: prevEndDate,
                },
            },
            select: {
                started_at: true,
                ended_at: true,
                total_pause_seconds: true,
            },
        });

        const previousFocusSeconds = this.calculateTotalFocusTime(previousSessions);
        const previousFocusHours = Number((previousFocusSeconds / 3600).toFixed(2));

        // Calculate percentage change
        const changePercent = this.calculatePercentageChange(currentFocusHours, previousFocusHours);

        // Calculate daily average
        const dailyAvgHours = daysInRange > 0
            ? Number((currentFocusHours / daysInRange).toFixed(2))
            : 0;

        // Calculate sessions percentile
        const sessionsPercentile = await this.calculateSessionsPercentile(userId, currentSessions.length, startDate, endDate);

        // ✅ NEW: Calculate daily breakdown for weekly activity chart
        const dailyBreakdown = this.calculateDailyBreakdown(currentSessions, startDate, endDate);

        return {
            range,
            focus_time_hours: currentFocusHours,
            focus_time_change_percent: changePercent,
            daily_avg_hours: dailyAvgHours,
            total_sessions: currentSessions.length,
            sessions_percentile: sessionsPercentile,
            daily_breakdown: dailyBreakdown,  // ✅ NEW
        };
    }

    private extractUsername(email: string): string {
        // Extract local part before @ and capitalize
        const localPart = email.split('@')[0];

        // Remove dots and underscores, then capitalize each word
        const words = localPart.split(/[._-]/);
        const capitalized = words
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');

        return capitalized || 'User';
    }

    private getDateRange(range: AnalyticsRange) {
        const now = new Date();
        const endDate = now;
        let startDate: Date;
        let daysInRange: number;

        switch (range) {
            case AnalyticsRange.LAST_7_DAYS:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 6); // Today + 6 days back = 7 days
                daysInRange = 7;
                break;

            case AnalyticsRange.LAST_30_DAYS:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 29); // Today + 29 days back = 30 days
                daysInRange = 30;
                break;

            case AnalyticsRange.ALL_TIME:
                startDate = new Date(0); // Beginning of time
                daysInRange = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                break;

            default:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 6);
                daysInRange = 7;
        }

        // Set to start of day
        startDate.setHours(0, 0, 0, 0);
        // Set to end of day
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate, daysInRange };
    }

    private getPreviousDateRange(range: AnalyticsRange) {
        const { startDate, daysInRange } = this.getDateRange(range);

        const endDate = new Date(startDate);
        endDate.setMilliseconds(-1); // One millisecond before current period

        const prevStartDate = new Date(endDate);
        prevStartDate.setDate(endDate.getDate() - daysInRange + 1);
        prevStartDate.setHours(0, 0, 0, 0);

        return { startDate: prevStartDate, endDate };
    }

    private calculateTotalFocusTime(sessions: Array<{ started_at: Date; ended_at: Date | null; total_pause_seconds: number }>): number {
        return sessions.reduce((total, session) => {
            if (session.ended_at && session.started_at) {
                const sessionDurationMs = session.ended_at.getTime() - session.started_at.getTime();
                const sessionDurationSeconds = Math.floor(sessionDurationMs / 1000);
                const actualSeconds = sessionDurationSeconds - session.total_pause_seconds;
                return total + actualSeconds;
            }
            return total;
        }, 0);
    }

    private calculatePercentageChange(current: number, previous: number): number {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return Number((((current - previous) / previous) * 100).toFixed(2));
    }

    private async calculateSessionsPercentile(userId: string, userSessionCount: number, startDate: Date, endDate: Date): Promise<number> {
        // Count total active users in the system
        const totalUsers = await this.prisma.users.count({
            where: {
                status: 'ACTIVE',
                deleted_at: null,
            },
        });

        if (totalUsers === 0) {
            return 0;
        }

        // Count users with fewer sessions than current user in the same period
        const usersWithFewerSessions = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(DISTINCT u.id)::bigint as count
            FROM users u
            LEFT JOIN pomodoro_sessions ps ON u.id = ps.user_id 
                AND ps.session_type = 'FOCUS'
                AND ps.state = 'COMPLETED'
                AND ps.started_at >= ${startDate}
                AND ps.started_at <= ${endDate}
            WHERE u.status = 'ACTIVE'
                AND u.deleted_at IS NULL
                AND u.id != ${userId}
            GROUP BY u.id
            HAVING COUNT(ps.id) < ${userSessionCount}
        `;

        const count = usersWithFewerSessions.length;
        const percentile = Number(((count / totalUsers) * 100).toFixed(2));

        return percentile;
    }
    private calculateDailyBreakdown(
        sessions: Array<{ started_at: Date; ended_at: Date | null; total_pause_seconds: number }>,
        startDate: Date,
        endDate: Date
    ): DailyBreakdownDto[] {
        const breakdown: DailyBreakdownDto[] = [];
        const currentDate = new Date(startDate);

        // Iterate through each day in the range
        while (currentDate <= endDate) {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const dayName = format(currentDate, 'EEE'); // Mon, Tue, Wed...

            // Filter sessions for this specific day
            const daySessions = sessions.filter(session => {
                const sessionDate = format(session.started_at, 'yyyy-MM-dd');
                return sessionDate === dateStr;
            });

            // Calculate stats for the day
            const totalSeconds = this.calculateTotalFocusTime(daySessions);
            const hours = Number((totalSeconds / 3600).toFixed(2));

            breakdown.push({
                date: dateStr,
                day_of_week: dayName,
                hours: hours,
                sessions: daySessions.length
            });

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return breakdown;
    }
}
