import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompanyEntity } from './company.entity';
import { EmployeeEntity } from './employee.entity';
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

  @Column({ name: 'consumidas', type: 'boolean', default: false })
  consumidas!: boolean;

  @Column({ name: 'estado', type: 'varchar', length: 32, default: VacationStatus.PENDIENTE })
  estado!: VacationStatus;

  @Column({ name: 'aprobado', type: 'boolean', default: false })
  aprobado!: boolean;

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
