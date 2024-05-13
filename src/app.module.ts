import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DB_HOST: Joi.string().hostname().required(),
        DB_PORT: Joi.number().port().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_USER: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        GOOGLE_OAUTH2_CLIENT_ID: Joi.string().required(),
        GOOGLE_OAUTH2_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_OAUTH2_REDIRECT_URL: Joi.string().uri().required(),
      }),
      validationOptions: { abortEarly: true },
    }),
  ],
})
export class AppModule {}
