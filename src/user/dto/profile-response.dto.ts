export interface UserInfoDto {
    id: string;
    email: string;
    username: string;
    member_since: string;
}

export interface LifetimeStatsDto {
    total_sessions: number;
    total_hours: number;
    total_minutes: number;
    total_pomodoros: number;
}

export interface StreakInfoDto {
    current_streak: number;
    longest_streak: number;
    last_active_date: string | null;
}

export interface DailyBreakdownDto {
    date: string;              // YYYY-MM-DD
    day_of_week: string;       // Mon, Tue, Wed, etc.
    hours: number;             // Hours for that day
    sessions: number;          // Sessions count for that day
}

export interface AnalyticsDto {
    range: string;
    focus_time_hours: number;
    focus_time_change_percent: number;
    daily_avg_hours: number;
    daily_goal_hours: number;
    total_sessions: number;
    sessions_percentile: number;
    daily_breakdown: DailyBreakdownDto[];  // ✅ NEW: Day-by-day data
}

export interface ProfileResponseDto {
    user: UserInfoDto;
    lifetime_stats: LifetimeStatsDto;
    streak: StreakInfoDto;
    analytics: AnalyticsDto;
}
