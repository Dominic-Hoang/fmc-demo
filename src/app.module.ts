import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';

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
        JWT_SECRET: Joi.string().min(20).required(),
      }),
      validationOptions: { abortEarly: true },
    }),
    AuthModule,
    UsersModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        database: configService.getOrThrow<string>('DB_NAME'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        synchronize: true,
        autoLoadEntities: true,
        logging: true,
      }),
    }),
  ],
})
export class AppModule {}
