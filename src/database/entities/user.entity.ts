import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { CompanyEntity } from './company.entity';
import { EmployeeEntity } from './employee.entity';
import { RoleEntity } from './role.entity';
import { TimeEntryAuditEntity } from './time-entry-audit.entity';
import { TimeEntryEntity } from './time-entry.entity';
import { TimeEntrySessionEntity } from './time-entry-session.entity';
import { AuthSessionEntity } from './auth-session.entity';
import { ApiKeyEntity } from './api-key.entity';

@Entity({ name: 'usuarios' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ unique: true })
  numero!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nombre?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  apellidos?: string | null;

  @Column()
  nombreEmpleado!: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  dni?: string | null;

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

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  locale?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  timezone?: string | null;

  @Column({ name: 'email_verified_at', type: 'datetime', nullable: true })
  emailVerifiedAt?: Date | null;

  @Column({ name: 'password_changed_at', type: 'datetime', nullable: true })
  passwordChangedAt?: Date | null;

  @Column({ name: 'must_change_password', type: 'boolean', default: false })
  mustChangePassword!: boolean;

  @Column({ name: 'last_login_ip', type: 'varchar', length: 64, nullable: true })
  lastLoginIp?: string | null;

  @ManyToOne(() => CompanyEntity, (company) => company.users, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity | null;

  @Column({ type: 'int', nullable: true })
  diasVacaciones?: number | null;

  @Column({ type: 'double', nullable: true })
  horasGeneradas?: number | null;

  @Column({ type: 'boolean', nullable: true })
  working?: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  enVacaciones?: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  deBaja?: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  admin?: boolean | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ultimoFichaje?: string | null;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true, select: false })
  lastLoginAt?: Date | null;

  @Column({ type: 'json', nullable: true })
  preferences?: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string | null;

  @OneToOne(() => EmployeeEntity, (employee) => employee.user, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'employee_id' })
  employee?: EmployeeEntity | null;

  @ManyToMany(() => RoleEntity, { eager: true })
  @JoinTable({ name: 'usuario_rol', joinColumn: { name: 'usuario_id' }, inverseJoinColumn: { name: 'rol_id' } })
  roles!: RoleEntity[];

  @OneToMany(() => TimeEntryEntity, (entry) => entry.usuario)
  timeEntries!: TimeEntryEntity[];

  @OneToMany(() => TimeEntrySessionEntity, (session) => session.usuario)
  timeEntrySessions!: TimeEntrySessionEntity[];

  @OneToMany(() => TimeEntryAuditEntity, (audit) => audit.correctedBy)
  timeEntryAudits!: TimeEntryAuditEntity[];

  @OneToMany(() => AuthSessionEntity, (session) => session.user)
  sessions!: AuthSessionEntity[];

  @OneToMany(() => ApiKeyEntity, (apiKey) => apiKey.user)
  apiKeys!: ApiKeyEntity[];
}
