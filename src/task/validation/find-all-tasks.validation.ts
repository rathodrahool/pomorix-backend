import * as Joi from 'joi';
import { baseQuerySchema } from 'src/common/validation/base-query.validation';

export const findAllTasksSchema = baseQuerySchema.keys({
    sort_by: Joi.string().valid('title', 'created_at', 'updated_at').optional(),
    user_id: Joi.string().uuid().optional(),
    is_active: Joi.boolean().optional(),
});
