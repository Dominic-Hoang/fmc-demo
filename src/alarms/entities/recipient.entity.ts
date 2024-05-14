import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

@Entity({ name: 'recipient' })
export class RecipientEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  emailAddress: string;

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.recipient)
  subscriptions: SubscriptionEntity[];
}
