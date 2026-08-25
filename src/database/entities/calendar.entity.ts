import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { CalendarDayEntity } from './calendar-day.entity';
import { CompanyEntity } from './company.entity';
import { EmployeeEntity } from './employee.entity';
import { WorkLocationEntity } from './work-location.entity';

@Entity({ name: 'calendarios' })
@Index(['company', 'nombre'], { unique: true })
@Index(['company', 'year'], { unique: true })
export class CalendarEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ManyToOne(() => CompanyEntity, (company) => company.calendars, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity | null;

  @Column({ type: 'boolean', default: false })
  active!: boolean;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  timezone?: string | null;

  @Column({ name: 'minutos_mas_entrada', type: 'int' })
  minutosMasEntrada!: number;

  @Column({ name: 'minutos_menos_entrada', type: 'int' })
  minutosMenosEntrada!: number;

  @Column({ name: 'working_days_per_week', type: 'tinyint', nullable: true })
  workingDaysPerWeek?: number | null;

  @Column({ name: 'weekly_target_minutes', type: 'int', nullable: true })
  weeklyTargetMinutes?: number | null;

  @Column({ name: 'monthly_target_minutes', type: 'int', nullable: true })
  monthlyTargetMinutes?: number | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @OneToMany(() => CalendarDayEntity, (day) => day.calendar, {
    eager: true,
    cascade: true
  })
  days!: CalendarDayEntity[];

  @OneToMany(() => EmployeeEntity, (employee) => employee.calendar)
  employees!: EmployeeEntity[];

  @OneToMany(() => WorkLocationEntity, (workLocation) => workLocation.calendar)
  workLocations!: WorkLocationEntity[];
}
