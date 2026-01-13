import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required().messages({
    'string.empty': 'DATABASE_URL is required',
  }),
  JWT_SECRET: Joi.string().required().messages({
    'string.empty': 'JWT_SECRET is required',
    'any.required': 'JWT_SECRET must be set in environment variables',
  }),
  JWT_EXPIRES_IN: Joi.string().default('7d').messages({
    'string.base': 'JWT_EXPIRES_IN must be a string (e.g., "7d", "24h")',
  }),
});
