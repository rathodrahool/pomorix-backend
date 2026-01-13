import * as Joi from 'joi';

export const findAllTasksSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    page_size: Joi.number().integer().min(1).max(100).default(10),
    sort_by: Joi.string().valid('created_at', 'updated_at', 'title').default('created_at'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().trim().optional(),
    is_active: Joi.boolean().optional(),
});
