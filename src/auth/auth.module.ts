import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OAuth2Client } from 'google-auth-library';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  providers: [
    AuthService,
    {
      provide: OAuth2Client,
      useFactory: (configService: ConfigService) => {
        return new OAuth2Client({
          clientId: configService.getOrThrow<string>('GOOGLE_OAUTH2_CLIENT_ID'),
          clientSecret: configService.getOrThrow<string>(
            'GOOGLE_OAUTH2_CLIENT_SECRET',
          ),
          redirectUri: configService.getOrThrow<string>(
            'GOOGLE_OAUTH2_REDIRECT_URL',
          ),
        });
      },
      inject: [ConfigService],
    },
  ],
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '120s' },
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
