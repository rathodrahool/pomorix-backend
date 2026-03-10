import * as Joi from 'joi';

export const createTodoSchema = Joi.object({
    title: Joi.string().trim().min(1).max(500).required(),
    description: Joi.string().trim().max(2000).optional().allow(''),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
});

export const updateTodoSchema = Joi.object({
    title: Joi.string().trim().min(1).max(500).optional(),
    description: Joi.string().trim().max(2000).optional().allow(''),
    is_completed: Joi.boolean().optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
}).min(1);
