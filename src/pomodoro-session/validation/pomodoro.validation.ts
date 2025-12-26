import * as Joi from 'joi';

export const startPomodoroSchema = Joi.object({
    focus_duration_seconds: Joi.number().integer().min(60).max(7200).required(), // 1 min to 2 hours
    break_duration_seconds: Joi.number().integer().min(60).max(1800).required(), // 1 min to 30 min
});
