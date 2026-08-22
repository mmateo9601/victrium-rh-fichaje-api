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

  @Column({ name: 'annual_contract_minutes', type: 'int', nullable: true })
  annualContractMinutes?: number | null;

  @Column({ name: 'working_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  workingPercentage?: string | null;

  @Column({ name: 'contract_type', type: 'varchar', length: 40 })
  contractType!: string;

  @Column({ name: 'policy_version', type: 'int', default: 1 })
  policyVersion!: number;

  @Column({ name: 'policy_snapshot', type: 'json', nullable: true })
  policySnapshot?: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
