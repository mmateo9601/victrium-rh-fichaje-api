import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

import { UserEntity } from './user.entity';
import { TimeEntryBreakEntity } from './time-entry-break.entity';

@Entity({ name: 'time_entry_sessions' })
@Index(['usuario', 'finishedAt'])
export class TimeEntrySessionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserEntity, (user) => user.timeEntrySessions, { eager: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: UserEntity;

  @Column({ type: 'datetime' })
  startedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  finishedAt!: Date | null;

  @Column({ type: 'varchar', length: 32, default: 'WORKING' })
  state!: 'WORKING' | 'PAUSED' | 'COMPLETED';

  @Column({ type: 'varchar', length: 32, default: 'web' })
  source!: string;

  @VersionColumn()
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => TimeEntryBreakEntity, (breakItem) => breakItem.session)
  breaks!: TimeEntryBreakEntity[];
}
