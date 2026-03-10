import * as Joi from 'joi';

export const baseQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  page_size: Joi.number().integer().min(1).max(100).optional().default(10),
  sort_by: Joi.string().optional().default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').optional().default('desc'),
  search: Joi.string().trim().optional().allow(''),
});
