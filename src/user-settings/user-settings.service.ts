import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { AlarmSound, TickingSound } from '@prisma/client';

@Injectable()
export class UserSettingsService {
    constructor(private readonly prisma: PrismaService) { }

    // Default settings constants
    private readonly DEFAULT_SETTINGS = {
        pomodoro_duration: 25,
        short_break: 5,
        long_break: 15,
        daily_goal_pomodoros: 1,
        alarm_sound: AlarmSound.BELLS,
        ticking_sound: TickingSound.NONE,
        volume: 50,
        auto_start_breaks: false,
        auto_start_pomodoros: true,
    };

    /**
     * Get user settings, create with defaults if doesn't exist
     */
    async getSettings(userId: string) {
        let settings = await this.prisma.user_settings.findUnique({
            where: { user_id: userId },
            select: {
                id: true,
                pomodoro_duration: true,
                short_break: true,
                long_break: true,
                daily_goal_pomodoros: true,
                alarm_sound: true,
                ticking_sound: true,
                volume: true,
                auto_start_breaks: true,
                auto_start_pomodoros: true,
                created_at: true,
                updated_at: true,
            },
        });

        // Auto-create settings with defaults if doesn't exist
        if (!settings) {
            settings = await this.prisma.user_settings.create({
                data: {
                    user_id: userId,
                    ...this.DEFAULT_SETTINGS,
                },
                select: {
                    id: true,
                    pomodoro_duration: true,
                    short_break: true,
                    long_break: true,
                    daily_goal_pomodoros: true,
                    alarm_sound: true,
                    ticking_sound: true,
                    volume: true,
                    auto_start_breaks: true,
                    auto_start_pomodoros: true,
                    created_at: true,
                    updated_at: true,
                },
            });
        }

        return settings;
    }

    /**
     * Update user settings
     */
    async updateSettings(userId: string, dto: UpdateUserSettingsDto) {
        // Ensure settings exist first
        await this.getSettings(userId);

        // Update settings
        const updated = await this.prisma.user_settings.update({
            where: { user_id: userId },
            data: dto,
            select: {
                id: true,
                pomodoro_duration: true,
                short_break: true,
                long_break: true,
                daily_goal_pomodoros: true,
                alarm_sound: true,
                ticking_sound: true,
                volume: true,
                auto_start_breaks: true,
                auto_start_pomodoros: true,
                created_at: true,
                updated_at: true,
            },
        });

        return updated;
    }

    /**
     * Reset settings to defaults
     */
    async resetSettings(userId: string) {
        // Ensure settings exist first
        await this.getSettings(userId);

        // Reset to defaults
        const resetSettings = await this.prisma.user_settings.update({
            where: { user_id: userId },
            data: this.DEFAULT_SETTINGS,
            select: {
                id: true,
                pomodoro_duration: true,
                short_break: true,
                long_break: true,
                daily_goal_pomodoros: true,
                alarm_sound: true,
                ticking_sound: true,
                volume: true,
                auto_start_breaks: true,
                auto_start_pomodoros: true,
                created_at: true,
                updated_at: true,
            },
        });

        return resetSettings;
    }
}
