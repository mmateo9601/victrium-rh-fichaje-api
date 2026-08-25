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

  @Column({ name: 'company_id', type: 'int', nullable: true })
  companyId?: number | null;

  @Column({ name: 'employee_id', type: 'int', nullable: true })
  employeeId?: number | null;

  @Column({ name: 'work_location_id', type: 'int', nullable: true })
  workLocationId?: number | null;

  @Column({ name: 'shift_id', type: 'int', nullable: true })
  shiftId?: number | null;

  @Column({ type: 'datetime' })
  startedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  finishedAt!: Date | null;

  @Column({ type: 'varchar', length: 32, default: 'WORKING' })
  state!: 'WORKING' | 'PAUSED' | 'COMPLETED';

  @Column({ type: 'varchar', length: 32, default: 'web' })
  source!: string;

  @Column({ name: 'device_id', type: 'varchar', length: 128, nullable: true })
  deviceId?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  timezone?: string | null;

  @Column({ name: 'started_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  startedLatitude?: string | null;

  @Column({ name: 'started_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  startedLongitude?: string | null;

  @Column({ name: 'paused_minutes', type: 'int', nullable: true })
  pausedMinutes?: number | null;

  @Column({ name: 'worked_minutes', type: 'int', nullable: true })
  workedMinutes?: number | null;

  @Column({ name: 'expected_minutes', type: 'int', nullable: true })
  expectedMinutes?: number | null;

  @Column({ name: 'overtime_minutes', type: 'int', nullable: true })
  overtimeMinutes?: number | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @VersionColumn()
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => TimeEntryBreakEntity, (breakItem) => breakItem.session)
  breaks!: TimeEntryBreakEntity[];
}
