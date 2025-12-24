import * as Joi from 'joi';

export const createTaskSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    title: Joi.string().trim().min(1).max(500).required(),
});

export const updateTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).max(500).optional(),
    is_active: Joi.boolean().optional(),
}).min(1);
