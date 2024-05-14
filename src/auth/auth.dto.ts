import { ApiProperty, OmitType } from '@nestjs/swagger';

export class UserCreateDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  password: string;
  @ApiProperty()
  displayName: string;
}

export class UserSignInDto extends OmitType(UserCreateDto, [
  'displayName',
] as const) {}
