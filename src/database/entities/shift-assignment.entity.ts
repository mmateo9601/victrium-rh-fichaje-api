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
import { ShiftEntity } from './shift.entity';

@Entity({ name: 'turno_asignaciones' })
@Index(['company', 'employee', 'validFrom', 'validTo'])
@Index(['employee', 'validFrom'])
export class ShiftAssignmentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.shiftAssignments, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  @ManyToOne(() => ShiftEntity, (shift) => shift.assignments, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'shift_id' })
  shift!: ShiftEntity;

  @ManyToOne(() => WorkLocationEntity, (workLocation) => workLocation.shiftAssignments, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'work_location_id' })
  workLocation?: WorkLocationEntity | null;

  @Column({ name: 'valid_from', type: 'date' })
  validFrom!: string;

  @Column({ name: 'valid_to', type: 'date', nullable: true })
  validTo?: string | null;

  @Column({ type: 'int', nullable: true })
  priority?: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  source?: string | null;

  @Column({ type: 'boolean', default: true })
  published!: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
