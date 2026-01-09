import * as Joi from 'joi';
import { AnalyticsRange } from '../dto/analytics-range.dto';

export const getProfileQuerySchema = Joi.object({
    range: Joi.string()
        .valid(...Object.values(AnalyticsRange))
        .optional()
        .default(AnalyticsRange.LAST_7_DAYS),
});
