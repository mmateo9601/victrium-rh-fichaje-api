import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ShiftEntity } from './shift.entity';

@Entity({ name: 'turno_dias' })
@Index(['shift', 'dayOfWeek'])
export class ShiftDayEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'day_of_week', type: 'tinyint' })
  dayOfWeek!: number;

  @Column({ name: 'working', type: 'boolean', default: true })
  working!: boolean;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime?: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime?: string | null;

  @Column({ name: 'break_minutes', type: 'int', default: 0 })
  breakMinutes!: number;

  @Column({ name: 'working_minutes', type: 'int', nullable: true })
  workingMinutes?: number | null;

  @Column({ name: 'crosses_midnight', type: 'boolean', default: false })
  crossesMidnight!: boolean;

  @ManyToOne(() => ShiftEntity, (shift) => shift.days, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'shift_id' })
  shift!: ShiftEntity;
}
