import {
  Column,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { AlarmEntity } from './alarm.entity';
import { RecipientEntity } from './recipient.entity';

@Entity({ name: 'subscription' })
export class SubscriptionEntity {
  @PrimaryColumn({ type: 'bigint' })
  alarmId: string;

  @PrimaryColumn({ type: 'bigint' })
  recipientId: string;

  @ManyToOne(() => AlarmEntity, (alarm) => alarm.subscriptions)
  @JoinColumn({ name: 'alarmId' })
  alarm: AlarmEntity;

  @ManyToOne(() => RecipientEntity, (recipient) => recipient.subscriptions)
  @JoinColumn({ name: 'recipientId' })
  recipient: RecipientEntity;

  @Column({ type: 'boolean' })
  active: boolean;

  @Column()
  @Generated('uuid')
  deactivateCode: string;
}
