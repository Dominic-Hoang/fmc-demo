import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

export class CredentialNotValidError extends Error {}
export class UserAlreadyExistError extends Error {}
export class Oauth2IdentityProviderError extends Error {}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async basicSignUp(
    name: string,
    password: string,
    displayName: string,
  ): Promise<string> {
    if (name.includes('@'))
      throw new CredentialNotValidError(
        'Basic sign up cannot contain @ character',
      );

    const user = await this.usersService.findOneByName(name);
    if (user !== null) throw new UserAlreadyExistError();

    const entity = new UserEntity();
    entity.name = name;
    entity.displayName = displayName;
    entity.hashedPassword = await this.hashPassword(password);
    const savedEntity = await this.usersService.createOne(entity);
    return await this.createJwtToken(savedEntity);
  }

  async basicSignIn(name: string, password: string): Promise<string> {
    const user = await this.usersService.findOneByName(name);
    if (user === null)
      throw new CredentialNotValidError('Basically user not exist');

    if (user.hashedPassword === null)
      throw new CredentialNotValidError(
        'This is type of user registered by Oauth2',
      );

    const passwordMatch = await this.comparePassword(
      password,
      user.hashedPassword,
    );

    if (!passwordMatch) throw new CredentialNotValidError('Wrong password');

    return await this.createJwtToken(user);
  }

  async oauth2SignIn(idToken: string): Promise<string> {
    const payload = await this.jwtService.decode(idToken);
    const email = payload.email;
    if (!email)
      throw new Oauth2IdentityProviderError(
        'Id token does not contain email field',
      );

    if (!email.includes('@'))
      throw new Oauth2IdentityProviderError(
        'Email return is invalid. Cannot use this email for registration.',
      );

    const user = await this.usersService.findOneByName(email);
    if (user !== null) return await this.createJwtToken(user);

    const displayName = payload.name ?? email;
    const entity = new UserEntity();
    entity.name = email;
    entity.displayName = displayName;
    entity.hashedPassword = null;
    const savedEntity = await this.usersService.createOne(entity);
    return await this.createJwtToken(savedEntity);
  }

  private async createJwtToken(user: UserEntity): Promise<string> {
    const payload = {
      sub: user.id.toString(),
      username: user.name,
      displayName: user.displayName,
    };
    return await this.jwtService.signAsync(payload);
  }

  private async hashPassword(plainTextPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(10, 'b');
    return await bcrypt.hash(plainTextPassword, salt);
  }

  private async comparePassword(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }
}
