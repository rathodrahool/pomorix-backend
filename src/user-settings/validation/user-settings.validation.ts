import * as Joi from 'joi';
import { AlarmSound, TickingSound } from '@prisma/client';

export const updateUserSettingsSchema = Joi.object({
    // Timer Settings (in minutes)
    pomodoro_duration: Joi.number().integer().optional(),
    short_break: Joi.number().integer().optional(),
    long_break: Joi.number().integer().optional(),

    // Sounds & Notifications
    alarm_sound: Joi.string().valid(...Object.values(AlarmSound)).optional(),
    ticking_sound: Joi.string().valid(...Object.values(TickingSound)).optional(),
    volume: Joi.number().integer().min(0).max(100).optional(),

    // Automation
    auto_start_breaks: Joi.boolean().optional(),
    auto_start_pomodoros: Joi.boolean().optional(),
}).min(1); // At least one field must be provided
