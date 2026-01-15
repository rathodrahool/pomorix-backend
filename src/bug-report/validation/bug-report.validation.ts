import * as Joi from 'joi';

export const createBugReportSchema = Joi.object({
    title: Joi.string().trim().min(5).max(150).required(),
    description: Joi.string().trim().min(10).max(2000).required(),
});

