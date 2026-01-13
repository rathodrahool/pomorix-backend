import * as Joi from 'joi';

export const startPomodoroSchema = Joi.object({
    session_type: Joi.string().valid('FOCUS', 'SHORT_BREAK', 'LONG_BREAK').required()
        .messages({
            'any.only': 'session_type must be one of: FOCUS, SHORT_BREAK, LONG_BREAK',
            'any.required': 'session_type is required'
        })
});
