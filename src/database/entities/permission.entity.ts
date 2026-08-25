import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompanyEntity } from './company.entity';
import { PermissionStatus } from './permission-status.enum';
import { EmployeeEntity } from './employee.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'permisos' })
@Index(['company', 'dia'])
@Index(['employee', 'dia'])
export class PermissionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio!: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin!: string;

  @Column({ type: 'date' })
  dia!: string;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  type?: string | null;

  @Column({ name: 'minutes_requested', type: 'int', nullable: true })
  minutesRequested?: number | null;

  @Column({ name: 'days_requested', type: 'decimal', precision: 5, scale: 2, nullable: true })
  daysRequested?: string | null;

  @Column({ type: 'varchar', length: 32, default: PermissionStatus.PENDIENTE })
  estado!: PermissionStatus;

  @Column({ type: 'boolean', default: false })
  aprobado!: boolean;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy?: UserEntity | null;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @ManyToOne(() => EmployeeEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'coverage_employee_id' })
  coverageEmployee?: EmployeeEntity | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.permissions, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
