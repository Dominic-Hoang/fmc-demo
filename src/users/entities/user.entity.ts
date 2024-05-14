import { AlarmEntity } from '../../alarms/entities/alarm.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 4096, nullable: true })
  hashedPassword: string | null;

  @Column({ type: 'varchar', length: 255 })
  displayName: string;

  @OneToMany(() => AlarmEntity, (alarm) => alarm.user)
  alarms: AlarmEntity[];
}
