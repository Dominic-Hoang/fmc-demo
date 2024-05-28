import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';

@Module({
  providers: [SchedulerService],
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'sendingEmails',
    }),
  ],
  exports: [SchedulerService],
})
export class SchedulerModule {}
