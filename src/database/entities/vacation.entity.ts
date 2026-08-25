import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompanyEntity } from './company.entity';
import { EmployeeEntity } from './employee.entity';
import { UserEntity } from './user.entity';
import { VacationStatus } from './vacation-status.enum';

@Entity({ name: 'vacaciones' })
@Index(['company', 'estado'])
@Index(['employee', 'inicio'])
export class VacationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'inicio', type: 'date' })
  inicio!: string;

  @Column({ name: 'fin', type: 'date' })
  fin!: string;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime?: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime?: string | null;

  @Column({ name: 'days_requested', type: 'decimal', precision: 5, scale: 2, nullable: true })
  daysRequested?: string | null;

  @Column({ name: 'minutes_requested', type: 'int', nullable: true })
  minutesRequested?: number | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  type?: string | null;

  @Column({ name: 'consumidas', type: 'boolean', default: false })
  consumidas!: boolean;

  @Column({ name: 'estado', type: 'varchar', length: 32, default: VacationStatus.PENDIENTE })
  estado!: VacationStatus;

  @Column({ name: 'aprobado', type: 'boolean', default: false })
  aprobado!: boolean;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy?: UserEntity | null;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: UserEntity | null;

  @Column({ name: 'rejected_reason', type: 'text', nullable: true })
  rejectedReason?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.vacations, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
