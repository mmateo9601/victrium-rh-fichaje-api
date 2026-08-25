import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { CalendarEntity } from './calendar.entity';
import { CompanySettingEntity } from './company-setting.entity';
import { DepartmentEntity } from './department.entity';
import { EmployeeEntity } from './employee.entity';
import { TeamEntity } from './team.entity';
import { PlanningPeriodEntity } from './planning-period.entity';
import { WorkLocationEntity } from './work-location.entity';
import { UserEntity } from './user.entity';
import { AuditLogEntity } from './audit-log.entity';

@Entity({ name: 'companies' })
export class CompanyEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 255, nullable: true })
  legalName?: string | null;

  @Column({ name: 'tax_id', type: 'varchar', length: 64, nullable: true })
  taxId?: string | null;

  @Column({ name: 'trade_name', type: 'varchar', length: 255, nullable: true })
  tradeName?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  province?: string | null;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode?: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  country?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone?: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail?: string | null;

  @Column({ name: 'billing_email', type: 'varchar', length: 255, nullable: true })
  billingEmail?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 255, nullable: true })
  logoUrl?: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  locale?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  timezone?: string | null;

  @Column({ name: 'fiscal_year_start_month', type: 'tinyint', nullable: true })
  fiscalYearStartMonth?: number | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ name: 'work_policy', type: 'json', nullable: true })
  workPolicy?: Record<string, unknown> | null;

  @ManyToOne(() => CalendarEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_calendar_id' })
  defaultCalendar?: CalendarEntity | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string | null;

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

  @OneToMany(() => DepartmentEntity, (department) => department.company)
  departments!: DepartmentEntity[];

  @OneToMany(() => TeamEntity, (team) => team.company)
  teams!: TeamEntity[];

  @OneToMany(() => CompanySettingEntity, (setting) => setting.company)
  settings!: CompanySettingEntity[];

  @OneToMany(() => AuditLogEntity, (auditLog) => auditLog.company)
  auditLogs!: AuditLogEntity[];
}
