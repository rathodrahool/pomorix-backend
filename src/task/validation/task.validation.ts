import * as Joi from 'joi';

export const createTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).max(500).required(),
    estimated_pomodoros: Joi.number().integer().min(1).max(100).optional(),
});

export const updateTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).max(500).optional(),
    is_active: Joi.boolean().optional(),
    estimated_pomodoros: Joi.number().integer().min(1).max(100).optional(),
}).min(1);
