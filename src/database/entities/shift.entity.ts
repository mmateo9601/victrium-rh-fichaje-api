import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { CompanyEntity } from './company.entity';
import { ShiftAssignmentEntity } from './shift-assignment.entity';
import { ShiftDayEntity } from './shift-day.entity';
import { ShiftOverrideEntity } from './shift-override.entity';

export type ShiftRotationStepValue = {
  working: boolean;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  workingMinutes: number | null;
  crossesMidnight: boolean;
};

@Entity({ name: 'turnos' })
@Index(['company', 'code'], { unique: true })
@Index(['company', 'name'], { unique: true })
export class ShiftEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  code!: string;

  @Column({ name: 'short_name', type: 'varchar', length: 80, nullable: true })
  shortName?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 24, nullable: true })
  color?: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'varchar', length: 80, nullable: true })
  timezone?: string | null;

  @Column({ name: 'expected_minutes', type: 'int', nullable: true })
  expectedMinutes?: number | null;

  @Column({ name: 'break_minutes_default', type: 'int', nullable: true })
  breakMinutesDefault?: number | null;

  @Column({ name: 'allow_overtime', type: 'boolean', nullable: true })
  allowOvertime?: boolean | null;

  @Column({ name: 'grace_minutes_before', type: 'int', nullable: true })
  graceMinutesBefore?: number | null;

  @Column({ name: 'grace_minutes_after', type: 'int', nullable: true })
  graceMinutesAfter?: number | null;

  @Column({ name: 'rest_between_shifts_minutes', type: 'int', nullable: true })
  restBetweenShiftsMinutes?: number | null;

  @Column({ name: 'is_night_shift', type: 'boolean', nullable: true })
  isNightShift?: boolean | null;

  @Column({ name: 'workday_type', type: 'varchar', length: 40, nullable: true })
  workdayType?: string | null;

  @Column({ name: 'rotation_start_date', type: 'date', nullable: true })
  rotationStartDate?: string | null;

  @Column({ name: 'rotation_pattern', type: 'json', nullable: true })
  rotationPattern?: ShiftRotationStepValue[] | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string | null;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @OneToMany(() => ShiftDayEntity, (day) => day.shift, { eager: true, cascade: true })
  days!: ShiftDayEntity[];

  @OneToMany(() => ShiftAssignmentEntity, (assignment) => assignment.shift)
  assignments!: ShiftAssignmentEntity[];

  @OneToMany(() => ShiftOverrideEntity, (shiftOverride) => shiftOverride.shift)
  overrides!: ShiftOverrideEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
