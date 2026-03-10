import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ObjectSchema } from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: ObjectSchema) {}

  transform(value: any) {
    const { error, value: validatedValue } = this.schema.validate(value, {
      abortEarly: true,
      allowUnknown: false,
      convert: true,
    });

    if (error) {
      const rawMessage = error.details[0].message;

      // 🔥 clean Joi quotes
      const cleanMessage = rawMessage.replace(/["]/g, '');

      throw new BadRequestException(cleanMessage);
    }

    return validatedValue;
  }
}
