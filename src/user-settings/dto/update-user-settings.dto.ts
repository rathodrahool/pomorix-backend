import { AlarmSound, TickingSound } from "@prisma/client";

export interface UpdateUserSettingsDto {
    // Timer Settings (in minutes)
    pomodoro_duration?: number; // 5-60 minutes
    short_break?: number; // 1-15 minutes
    long_break?: number; // 5-45 minutes

    // Sounds & Notifications
    alarm_sound?: AlarmSound
    ticking_sound?: TickingSound
    volume?: number; // 0-100%

    // Automation
    auto_start_breaks?: boolean;
    auto_start_pomodoros?: boolean;
}
