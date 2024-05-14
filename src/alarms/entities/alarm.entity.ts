import { Subscription } from 'rxjs';
import { UserEntity } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

@Entity({ name: 'alarm' })
export class AlarmEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'text' })
  cron: string;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.alarm)
  subscriptions: Subscription[];

  @ManyToOne(() => UserEntity, (user) => user.alarms)
  user: UserEntity;
}
