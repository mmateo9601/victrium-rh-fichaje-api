import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { CompanyEntity } from './company.entity';
import { EmployeeEntity } from './employee.entity';
import { WorkLocationEntity } from './work-location.entity';

@Entity({ name: 'employment_terms' })
@Index(['company', 'employee', 'effectiveFrom'])
@Index(['employee', 'effectiveFrom', 'effectiveTo'])
export class EmploymentTermsEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.employmentTerms, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  @ManyToOne(() => WorkLocationEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'primary_work_location_id' })
  primaryWorkLocation?: WorkLocationEntity | null;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: string | null;

  @Column({ name: 'weekly_contract_minutes', type: 'int' })
  weeklyContractMinutes!: number;

  @Column({ name: 'daily_contract_minutes', type: 'int', nullable: true })
  dailyContractMinutes?: number | null;

  @Column({ name: 'monthly_contract_minutes', type: 'int', nullable: true })
  monthlyContractMinutes?: number | null;

  @Column({ name: 'annual_contract_minutes', type: 'int', nullable: true })
  annualContractMinutes?: number | null;

  @Column({ name: 'working_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  workingPercentage?: string | null;

  @Column({ name: 'contract_type', type: 'varchar', length: 40 })
  contractType!: string;

  @Column({ name: 'employment_group', type: 'varchar', length: 80, nullable: true })
  employmentGroup?: string | null;

  @Column({ name: 'position_title', type: 'varchar', length: 150, nullable: true })
  positionTitle?: string | null;

  @Column({ name: 'department_name', type: 'varchar', length: 150, nullable: true })
  departmentName?: string | null;

  @Column({ name: 'team_name', type: 'varchar', length: 150, nullable: true })
  teamName?: string | null;

  @ManyToOne(() => EmployeeEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_employee_id' })
  manager?: EmployeeEntity | null;

  @Column({ name: 'start_shift_minutes_before', type: 'int', nullable: true })
  startShiftMinutesBefore?: number | null;

  @Column({ name: 'start_shift_minutes_after', type: 'int', nullable: true })
  startShiftMinutesAfter?: number | null;

  @Column({ name: 'overtime_allowed', type: 'boolean', nullable: true })
  overtimeAllowed?: boolean | null;

  @Column({ name: 'rest_between_shifts_minutes', type: 'int', nullable: true })
  restBetweenShiftsMinutes?: number | null;

  @Column({ name: 'break_policy_minutes', type: 'int', nullable: true })
  breakPolicyMinutes?: number | null;

  @Column({ name: 'vacation_days_annual', type: 'int', nullable: true })
  vacationDaysAnnual?: number | null;

  @Column({ name: 'notice_days', type: 'int', nullable: true })
  noticeDays?: number | null;

  @Column({ name: 'policy_version', type: 'int', default: 1 })
  policyVersion!: number;

  @Column({ name: 'policy_snapshot', type: 'json', nullable: true })
  policySnapshot?: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

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
}
