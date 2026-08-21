import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { CompanyEntity } from './company.entity';
import { CalendarEntity } from './calendar.entity';
import { UserEntity } from './user.entity';
import { PermissionEntity } from './permission.entity';
import { IncidentEntity } from './incident.entity';
import { VacationEntity } from './vacation.entity';
import { ShiftAssignmentEntity } from './shift-assignment.entity';
import { ShiftOverrideEntity } from './shift-override.entity';
import { EmployeeLocationAssignmentEntity } from './employee-location-assignment.entity';

@Entity({ name: 'employees' })
@Index(['company', 'numero'], { unique: true })
@Index(['company', 'dni'], { unique: true })
export class EmployeeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'numero' })
  numero!: string;

  @Column({ name: 'nombre_empleado' })
  nombreEmpleado!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  dni!: string;

  @Column({ name: 'dias_vacaciones', type: 'int', nullable: true })
  diasVacaciones?: number | null;

  @Column({ name: 'horas_generadas', type: 'double', nullable: true })
  horasGeneradas?: number | null;

  @Column({ type: 'boolean', nullable: true })
  working?: boolean | null;

  @Column({ name: 'en_vacaciones', type: 'boolean', nullable: true })
  enVacaciones?: boolean | null;

  @Column({ name: 'de_baja', type: 'boolean', nullable: true })
  deBaja?: boolean | null;

  @Column({ name: 'ultimo_fichaje', type: 'varchar', length: 255, nullable: true })
  ultimoFichaje?: string | null;

  @ManyToOne(() => CompanyEntity, (company) => company.employees, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @OneToOne(() => UserEntity, (user) => user.employee, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  user?: UserEntity | null;

  @OneToMany(() => VacationEntity, (vacation) => vacation.employee)
  vacations!: VacationEntity[];

  @OneToMany(() => IncidentEntity, (incident) => incident.employee)
  incidents!: IncidentEntity[];

  @OneToMany(() => PermissionEntity, (permission) => permission.employee)
  permissions!: PermissionEntity[];

  @OneToMany(() => ShiftAssignmentEntity, (assignment) => assignment.employee)
  shiftAssignments!: ShiftAssignmentEntity[];

  @OneToMany(() => ShiftOverrideEntity, (shiftOverride) => shiftOverride.employee)
  shiftOverrides!: ShiftOverrideEntity[];

  @OneToMany(() => EmployeeLocationAssignmentEntity, (assignment) => assignment.employee)
  locationAssignments!: EmployeeLocationAssignmentEntity[];

  @ManyToOne(() => CalendarEntity, (calendar) => calendar.employees, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'calendar_id' })
  calendar?: CalendarEntity | null;
}
