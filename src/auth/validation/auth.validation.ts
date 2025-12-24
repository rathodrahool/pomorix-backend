import * as Joi from 'joi';

export const signupSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    auth_provider: Joi.string().valid('GOOGLE', 'APPLE').required().messages({
        'any.only': 'Auth provider must be either GOOGLE or APPLE',
        'any.required': 'Auth provider is required',
    }),
    auth_provider_id: Joi.string().required().messages({
        'any.required': 'Auth provider ID is required',
    }),
});
