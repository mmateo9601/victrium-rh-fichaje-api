import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompanyEntity } from './company.entity';
import { EmployeeEntity } from './employee.entity';

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

  @Column({ type: 'date' })
  dia!: string;

  @Column({ type: 'boolean', default: false })
  resuelta!: boolean;

  @Column({ type: 'text', nullable: true })
  explicacion?: string | null;

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
