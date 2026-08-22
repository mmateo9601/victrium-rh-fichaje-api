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
import { ShiftEntity } from './shift.entity';
import { WorkLocationEntity } from './work-location.entity';

export type ShiftOverrideKind = 'SHIFT' | 'OFF';

@Entity({ name: 'turno_overrides' })
@Index(['employee', 'date'], { unique: true })
export class ShiftOverrideEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.shiftOverrides, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  @ManyToOne(() => ShiftEntity, (shift) => shift.overrides, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'shift_id' })
  shift?: ShiftEntity | null;

  @ManyToOne(() => WorkLocationEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'work_location_id' })
  workLocation?: WorkLocationEntity | null;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 16, default: 'SHIFT' })
  kind!: ShiftOverrideKind;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
