import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { TimeEntrySessionEntity } from './time-entry-session.entity';

@Entity({ name: 'time_entry_breaks' })
@Index(['session', 'endedAt'])
export class TimeEntryBreakEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => TimeEntrySessionEntity, (session) => session.breaks, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'session_id' })
  session!: TimeEntrySessionEntity;

  @Column({ type: 'datetime' })
  startedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  endedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
