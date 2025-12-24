import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required().messages({
    'string.empty': 'DATABASE_URL is required',
  }),
});
