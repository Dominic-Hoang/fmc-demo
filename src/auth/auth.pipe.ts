import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class UserCreateDtoValidationPipe implements PipeTransform {
  private schema = Joi.object({
    name: Joi.string().required().min(5),
    password: Joi.string().required().min(8),
    displayName: Joi.string().required(),
  });

  transform(value: any) {
    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException('Invalid user');
    }
    return value;
  }
}

@Injectable()
export class UserSignInDtoValidationPipe implements PipeTransform {
  private schema = Joi.object({
    name: Joi.string().required().min(5),
    password: Joi.string().required().min(8),
  });

  transform(value: any) {
    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException('Invalid user name or password');
    }
    return value;
  }
}
