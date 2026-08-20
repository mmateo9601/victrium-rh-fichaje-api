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
import { AuthSessionEntity } from './auth-session.entity';

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

  @Column()
  nombreEmpleado!: string;

  @Column({ unique: true })
  dni!: string;

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

  @Column({ nullable: true })
  ultimoFichaje?: string | null;

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

  @OneToMany(() => TimeEntryAuditEntity, (audit) => audit.correctedBy)
  timeEntryAudits!: TimeEntryAuditEntity[];

  @OneToMany(() => AuthSessionEntity, (session) => session.user)
  sessions!: AuthSessionEntity[];
}
