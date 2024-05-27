import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidCron } from 'cron-validator';
import * as Joi from 'joi';

@Injectable()
export class CreateAlarmDtoValidationPipe implements PipeTransform {
  private schema = Joi.object({
    cron: Joi.string()
      .custom((value, helpers) => {
        if (!isValidCron(value, { seconds: true })) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'Cron validation')
      .required(),
    subject: Joi.string().required(),
    message: Joi.string().required(),
  });

  transform(value: any) {
    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException('Invalid alarm');
    }
    return value;
  }
}

@Injectable()
export class UpdateAlarmDtoValidationPipe implements PipeTransform {
  private schema = Joi.object({
    cron: Joi.string().custom((value, helpers) => {
      if (!isValidCron(value, { seconds: true })) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'Cron validation'),
    subject: Joi.string(),
    message: Joi.string(),
  });

  transform(value: any) {
    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException('Invalid alarm');
    }
    return value;
  }
}

@Injectable()
export class RecipientDtoValidationPipe implements PipeTransform {
  private schema = Joi.object({
    emailAddress: Joi.string().email().required(),
  });

  transform(value: any) {
    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException('Invalid email address');
    }
    return value;
  }
}
