import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'staging')
    .default('development')
    .messages({
      'any.only': 'NODE_ENV must be one of: development, production, staging',
    }),
  PORT: Joi.number().default(3000).messages({
    'number.base': 'PORT must be a number',
  }),
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
