import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DistributedLockService } from './distributed-lock.service';
import { Redis } from 'ioredis';
import { BullModule } from '@nestjs/bull';
import { AlarmsModule } from '../alarms/alarms.module';

@Module({
  providers: [
    SchedulerService,
    DistributedLockService,
    {
      provide: Redis,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Redis({
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
        }),
    },
  ],
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'sendingEmails',
    }),
    AlarmsModule,
  ],
})
export class SchedulerModule {}
