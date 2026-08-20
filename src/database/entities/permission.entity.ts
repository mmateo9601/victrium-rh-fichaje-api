import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompanyEntity } from './company.entity';
import { PermissionStatus } from './permission-status.enum';
import { EmployeeEntity } from './employee.entity';

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

  @Column({ type: 'varchar', length: 32, default: PermissionStatus.PENDIENTE })
  estado!: PermissionStatus;

  @Column({ type: 'boolean', default: false })
  aprobado!: boolean;

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
