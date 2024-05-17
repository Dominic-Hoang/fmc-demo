import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AlarmEntity } from './entities/alarm.entity';
import { RecipientEntity } from './entities/recipient.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AlarmService {
  constructor(
    @InjectRepository(AlarmEntity)
    private readonly alarmRepository: Repository<AlarmEntity>,

    private readonly userService: UsersService,

    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async getAlarms(): Promise<AlarmEntity[]> {
    return await this.alarmRepository.find();
  }

  async getAlarmById(alarmId: string): Promise<AlarmEntity> {
    const alarm = await this.alarmRepository
      .createQueryBuilder('alarm')
      .leftJoinAndSelect(
        'alarm.subscriptions',
        'subscription',
        'subscription.active = :active',
        { active: true },
      )
      .leftJoinAndSelect('subscription.recipient', 'recipient')
      .where('alarm.id = :alarmId', { alarmId })
      .getOne();
    if (!alarm) throw new Error('Alarm not found');
    return alarm;
  }

  async getUserAlarms(userId: string): Promise<AlarmEntity[]> {
    return await this.alarmRepository.find({
      where: { user: { id: userId } },
    });
  }

  async getUserAlarmById(
    userId: string,
    alarmId: string,
  ): Promise<AlarmEntity> {
    const alarm = await this.alarmRepository.findOne({
      where: { id: alarmId, user: { id: userId } },
    });
    if (!alarm) {
      throw new Error('Alarm not found for this user');
    }
    return alarm;
  }

  async createUserAlarm(
    userId: string,
    cron: string,
    subject: string,
    message: string,
  ): Promise<AlarmEntity> {
    const user = await this.userService.findOneById(userId);
    if (!user) throw new Error('User not found!');
    const alarm = this.alarmRepository.create({ cron, subject, message, user });
    return await this.alarmRepository.save(alarm);
  }

  async updateUserAlarm(
    userId: string,
    alarmId: string,
    cron?: string,
    subject?: string,
    message?: string,
  ): Promise<AlarmEntity> {
    const alarm = await this.alarmRepository.findOne({
      where: { id: alarmId, user: { id: userId } },
    });
    if (!alarm) {
      throw new Error('Alarm not found for this user');
    }
    if (cron) alarm.cron = cron;
    if (subject) alarm.subject = subject;
    if (message) alarm.message = message;
    return await this.alarmRepository.save(alarm);
  }

  async deleteUserAlarm(userId: string, alarmId: string): Promise<void> {
    const alarm = await this.alarmRepository.findOne({
      where: { id: alarmId, user: { id: userId } },
    });
    if (!alarm) {
      throw new Error('Alarm not found for this user');
    }
    await this.alarmRepository.remove(alarm);
  }

  async addRecipientToUserAlarm(
    userId: string,
    alarmId: string,
    emailAddress: string,
  ): Promise<RecipientEntity> {
    const alarm = await this.alarmRepository.findOne({
      where: { id: alarmId, user: { id: userId } },
    });
    if (!alarm) {
      throw new Error('Alarm not found for this user');
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let recipient = await queryRunner.manager.findOne(RecipientEntity, {
        where: { emailAddress },
      });
      if (!recipient) {
        const recipientEntity = queryRunner.manager.create(RecipientEntity, {
          emailAddress,
        });
        recipient = await queryRunner.manager.save(recipientEntity);
      }
      const subscription = await queryRunner.manager.findOne(
        SubscriptionEntity,
        { where: { alarmId, recipientId: recipient.id } },
      );
      if (subscription === null) {
        const subscriptionEntity = queryRunner.manager.create(
          SubscriptionEntity,
          { alarmId, recipientId: recipient.id, active: true },
        );
        await queryRunner.manager.save(subscriptionEntity);
      }
      await queryRunner.commitTransaction();
      return recipient;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listRecipientsOfUserAlarm(
    userId: string,
    alarmId: string,
  ): Promise<RecipientEntity[]> {
    const alarm = await this.alarmRepository.findOne({
      where: { id: alarmId, user: { id: userId } },
    });
    if (!alarm) {
      throw new Error('Alarm not found for this user');
    }

    const activeSubscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .innerJoinAndSelect('subscription.recipient', 'recipient')
      .where('subscription.alarmId = :alarmId', { alarmId })
      .andWhere('subscription.active = :active', { active: true })
      .getMany();

    return activeSubscriptions.map((subscription) => subscription.recipient);
  }

  async deactivateSubscription(deactivateCode: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { deactivateCode },
    });
    if (!subscription) {
      throw new Error('Invalid deactivation code');
    }
    subscription.active = false;
    await this.subscriptionRepository.save(subscription);
  }

  async resubscribeToAlarm(deactivateCode: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { deactivateCode },
    });
    if (!subscription) {
      throw new Error('Invalid deactivation code');
    }

    subscription.active = true;
    await this.subscriptionRepository.save(subscription);
  }
}
