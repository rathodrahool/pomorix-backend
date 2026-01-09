import * as Joi from 'joi';

export const globalFeedQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
});
