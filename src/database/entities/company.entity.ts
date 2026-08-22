import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { CalendarEntity } from './calendar.entity';
import { EmployeeEntity } from './employee.entity';
import { PlanningPeriodEntity } from './planning-period.entity';
import { WorkLocationEntity } from './work-location.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'companies' })
export class CompanyEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  timezone?: string | null;

  @Column({ name: 'work_policy', type: 'json', nullable: true })
  workPolicy?: Record<string, unknown> | null;

  @ManyToOne(() => CalendarEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_calendar_id' })
  defaultCalendar?: CalendarEntity | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => EmployeeEntity, (employee) => employee.company)
  employees!: EmployeeEntity[];

  @OneToMany(() => UserEntity, (user) => user.company)
  users!: UserEntity[];

  @OneToMany(() => WorkLocationEntity, (workLocation) => workLocation.company)
  workLocations!: WorkLocationEntity[];

  @OneToMany(() => CalendarEntity, (calendar) => calendar.company)
  calendars!: CalendarEntity[];

  @OneToMany(() => PlanningPeriodEntity, (planningPeriod) => planningPeriod.company)
  planningPeriods!: PlanningPeriodEntity[];
}
