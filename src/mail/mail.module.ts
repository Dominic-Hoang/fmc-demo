import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MailWorkerService } from './worker.service';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';
import { AlarmsModule } from '../alarms/alarms.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sendingEmails',
    }),
    ConfigModule,
    AlarmsModule,
  ],
  providers: [MailWorkerService, MailService],
})
export class MailModule {}
