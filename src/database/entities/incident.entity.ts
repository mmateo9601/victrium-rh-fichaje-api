import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompanyEntity } from './company.entity';
import { EmployeeEntity } from './employee.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'incidencias' })
@Index(['company', 'dia'])
@Index(['employee', 'dia'])
export class IncidentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'varchar', length: 255 })
  resumen!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  type?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  severity?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  category?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  source?: string | null;

  @Column({ type: 'date' })
  dia!: string;

  @Column({ type: 'boolean', default: false })
  resuelta!: boolean;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reported_by_id' })
  reportedBy?: UserEntity | null;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy?: UserEntity | null;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  explicacion?: string | null;

  @Column({ type: 'json', nullable: true })
  attachments?: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.incidents, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
