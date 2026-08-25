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
import { WorkLocationEntity } from './work-location.entity';
import { PermissionEntity } from './permission.entity';
import { IncidentEntity } from './incident.entity';
import { VacationEntity } from './vacation.entity';
import { ShiftAssignmentEntity } from './shift-assignment.entity';
import { ShiftOverrideEntity } from './shift-override.entity';
import { EmployeeLocationAssignmentEntity } from './employee-location-assignment.entity';
import { EmploymentTermsEntity } from './employment-terms.entity';

@Entity({ name: 'employees' })
@Index(['company', 'numero'], { unique: true })
@Index(['company', 'dni'], { unique: true })
export class EmployeeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'numero' })
  numero!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nombre?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  apellidos?: string | null;

  @Column({ name: 'nombre_empleado' })
  nombreEmpleado!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'email_personal', type: 'varchar', length: 255, nullable: true })
  emailPersonal?: string | null;

  @Column({ unique: true })
  dni!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  telefono?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  movil?: string | null;

  @Column({ type: 'text', nullable: true })
  direccion?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  ciudad?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  provincia?: string | null;

  @Column({ name: 'codigo_postal', type: 'varchar', length: 20, nullable: true })
  codigoPostal?: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  pais?: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  genero?: string | null;

  @Column({ name: 'numero_seguridad_social', type: 'varchar', length: 64, nullable: true })
  numeroSeguridadSocial?: string | null;

  @Column({ type: 'varchar', length: 34, nullable: true })
  iban?: string | null;

  @Column({ name: 'titular_iban', type: 'varchar', length: 255, nullable: true })
  titularIban?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  cargo?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  departamento?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  equipo?: string | null;

  @ManyToOne(() => EmployeeEntity, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_employee_id' })
  manager?: EmployeeEntity | null;

  @Column({ name: 'fecha_alta', type: 'date', nullable: true })
  fechaAlta?: string | null;

  @Column({ name: 'fecha_baja', type: 'date', nullable: true })
  fechaBaja?: string | null;

  @Column({ name: 'tipo_contrato', type: 'varchar', length: 40, nullable: true })
  tipoContrato?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  modalidad?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  jornada?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  puesto?: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  timezone?: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  idioma?: string | null;

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

  @Column({ name: 'work_status', type: 'varchar', length: 32, nullable: true })
  workStatus?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string | null;

  @ManyToOne(() => WorkLocationEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'primary_work_location_id' })
  primaryWorkLocation?: WorkLocationEntity | null;

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

  @OneToMany(() => EmploymentTermsEntity, (employmentTerms) => employmentTerms.employee)
  employmentTerms!: EmploymentTermsEntity[];

  @ManyToOne(() => CalendarEntity, (calendar) => calendar.employees, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'calendar_id' })
  calendar?: CalendarEntity | null;
}
