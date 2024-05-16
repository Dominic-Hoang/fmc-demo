import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

export class AlarmDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cron: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  message: string;
}

export class CreateAlarmDto extends OmitType(AlarmDto, ['id']) {}

export class UpdateAlarmDto extends PartialType(OmitType(AlarmDto, ['id'])) {}

export class RecipientDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  emailAddress: string;
}

export class CreateRecipientDto extends OmitType(RecipientDto, ['id']) {}
export class UpdateRecipientDto extends PartialType(
  OmitType(RecipientDto, ['id']),
) {}
