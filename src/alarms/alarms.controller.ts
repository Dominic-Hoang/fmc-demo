import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard, UserId } from '../auth/auth.guard';
import {
  AlarmDto,
  CreateAlarmDto,
  CreateRecipientDto,
  RecipientDto,
  UpdateAlarmDto,
} from './alarms.dto';
import { AlarmService } from './alarms.service';

@ApiTags('Alarm management')
@ApiBearerAuth()
@Controller('alarms')
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @Get('@unsubscribe')
  async deactivateSubscription(
    @Query('deactivateCode') deactivateCode: string,
  ) {
    try {
      await this.alarmService.deactivateSubscription(deactivateCode);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Get('@resubscribe')
  async resubscribeToAlarm(@Query('deactivateCode') deactivateCode: string) {
    try {
      return await this.alarmService.resubscribeToAlarm(deactivateCode);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  async getUserAlarms(@UserId() userId: string): Promise<AlarmDto[]> {
    try {
      return (await this.alarmService.getUserAlarms(userId)).map((entity) => {
        const dto = new AlarmDto();
        dto.id = entity.id;
        dto.cron = entity.cron;
        dto.subject = entity.subject;
        dto.message = entity.message;
        return dto;
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @UseGuards(AuthGuard)
  async createAlarm(
    @UserId() userId: string,
    @Body() createAlarmDto: CreateAlarmDto,
  ): Promise<AlarmDto> {
    try {
      const entity = await this.alarmService.createAlarm(
        userId,
        createAlarmDto.cron,
        createAlarmDto.subject,
        createAlarmDto.message,
      );
      const dto = new AlarmDto();
      dto.id = entity.id;
      dto.cron = entity.cron;
      dto.message = entity.message;
      dto.subject = entity.subject;
      return dto;
    } catch (error) {
      throw new NotFoundException();
    }
  }

  @Get(':alarmId')
  @UseGuards(AuthGuard)
  async getAlarmById(
    @UserId() userId: string,
    @Param('alarmId') alarmId: string,
  ) {
    try {
      return await this.alarmService.getAlarmById(userId, alarmId);
    } catch (error) {
      throw new NotFoundException();
    }
  }

  @Patch(':alarmId')
  @UseGuards(AuthGuard)
  async updateAlarm(
    @UserId() userId: string,
    @Param('alarmId') alarmId: string,
    @Body() updateAlarmDto: UpdateAlarmDto,
  ): Promise<AlarmDto> {
    try {
      const entity = await this.alarmService.updateAlarm(
        userId,
        alarmId,
        updateAlarmDto.cron,
        updateAlarmDto.subject,
        updateAlarmDto.message,
      );
      const dto = new AlarmDto();
      dto.id = entity.id;
      dto.cron = entity.cron;
      dto.message = entity.message;
      dto.subject = entity.subject;
      return dto;
    } catch (error) {
      throw new NotFoundException();
    }
  }

  @Delete(':alarmId')
  @UseGuards(AuthGuard)
  async deleteAlarm(
    @UserId() userId: string,
    @Param('alarmId') alarmId: string,
  ): Promise<void> {
    try {
      await this.alarmService.deleteAlarm(userId, alarmId);
    } catch (error) {
      throw new NotFoundException();
    }
  }

  @Get(':alarmId/recipients')
  @UseGuards(AuthGuard)
  async listRecipientsOfAlarm(
    @UserId() userId: string,
    @Param('alarmId') alarmId: string,
  ): Promise<RecipientDto[]> {
    try {
      return (
        await this.alarmService.listRecipientsOfAlarm(userId, alarmId)
      ).map((recipient) => {
        const dto = new RecipientDto();
        dto.id = recipient.id;
        dto.emailAddress = recipient.emailAddress;
        return dto;
      });
    } catch (error) {
      throw new NotFoundException();
    }
  }

  @Post(':alarmId/recipients')
  @UseGuards(AuthGuard)
  async addRecipientToAlarm(
    @UserId() userId: string,
    @Param('alarmId') alarmId: string,
    @Body() addRecipientDto: CreateRecipientDto,
  ): Promise<RecipientDto> {
    try {
      const recipient = await this.alarmService.addRecipientToAlarm(
        userId,
        alarmId,
        addRecipientDto.emailAddress,
      );

      const dto = new RecipientDto();
      dto.id = recipient.id;
      dto.emailAddress = recipient.emailAddress;
      return dto;
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
