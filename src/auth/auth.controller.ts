import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpRedirectResponse,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Query,
  Redirect,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OAuth2Client } from 'google-auth-library';
import { UserCreateDto, UserSignInDto } from './auth.dto';
import {
  AuthService,
  CredentialNotValidError,
  UserAlreadyExistError,
} from './auth.service';

const GOOGLE_OAUTH2_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleOauth2Client: OAuth2Client,
  ) {}

  @Get('oauth2/google/url')
  @Redirect()
  getGoogleOauth2Url(): HttpRedirectResponse {
    return {
      url: this.googleOauth2Client.generateAuthUrl({
        scope: GOOGLE_OAUTH2_SCOPES,
      }),
      statusCode: HttpStatus.TEMPORARY_REDIRECT,
    };
  }

  @Get('oauth2/google/callback')
  async getGoogleOauth2AuthorizationCode(@Query('code') code: string) {
    try {
      const { tokens } = await this.googleOauth2Client.getToken(code);
      if (!tokens.id_token) throw new ServiceUnavailableException();
      const accessToken = await this.authService.oauth2SignIn(tokens.id_token);
      return {
        access_token: accessToken,
      };
    } catch {
      throw new ServiceUnavailableException();
    }
  }

  @Post('basic/signUp')
  @HttpCode(HttpStatus.CREATED)
  async basicAuthSignUp(@Body() userCreateDto: UserCreateDto) {
    try {
      const accessToken = await this.authService.basicSignUp(
        userCreateDto.name,
        userCreateDto.password,
        userCreateDto.displayName,
      );
      return {
        access_token: accessToken,
      };
    } catch (e) {
      if (e instanceof CredentialNotValidError) throw new BadRequestException();
      if (e instanceof UserAlreadyExistError) throw new ConflictException();
      throw new InternalServerErrorException();
    }
  }

  @Post('basic/signIn')
  @HttpCode(HttpStatus.OK)
  async basicAuthSignIn(@Body() signInDto: UserSignInDto) {
    try {
      const accessToken = await this.authService.basicSignIn(
        signInDto.name,
        signInDto.password,
      );
      return {
        access_token: accessToken,
      };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
