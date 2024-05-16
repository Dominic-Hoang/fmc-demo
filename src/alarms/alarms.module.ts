import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlarmEntity } from './entities/alarm.entity';
import { RecipientEntity } from './entities/recipient.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { UsersModule } from '../users/users.module';
import { AlarmController } from './alarms.controller';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AlarmService } from './alarms.service';

@Module({
  controllers: [AlarmController],
  providers: [AlarmService],
  imports: [
    TypeOrmModule.forFeature([
      AlarmEntity,
      RecipientEntity,
      SubscriptionEntity,
    ]),
    UsersModule,
    AuthModule,
    ConfigModule,
  ],
})
export class AlarmsModule {}
