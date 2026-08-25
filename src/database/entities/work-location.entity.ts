import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { CalendarEntity } from './calendar.entity';
import { CompanyEntity } from './company.entity';
import { EmployeeLocationAssignmentEntity } from './employee-location-assignment.entity';
import { ShiftAssignmentEntity } from './shift-assignment.entity';

@Entity({ name: 'work_locations' })
@Index(['company', 'code'], { unique: true })
@Index(['company', 'name'], { unique: true })
export class WorkLocationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CompanyEntity, (company) => company.workLocations, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column()
  name!: string;

  @Column()
  code!: string;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  province?: string | null;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  timezone?: string | null;

  @Column({ name: 'contact_name', type: 'varchar', length: 255, nullable: true })
  contactName?: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 32, nullable: true })
  contactPhone?: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail?: string | null;

  @Column({ name: 'cost_center_code', type: 'varchar', length: 64, nullable: true })
  costCenterCode?: string | null;

  @Column({ name: 'opening_hours', type: 'json', nullable: true })
  openingHours?: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: string | null;

  @ManyToOne(() => CalendarEntity, (calendar) => calendar.workLocations, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'calendar_id' })
  calendar?: CalendarEntity | null;

  @OneToMany(() => EmployeeLocationAssignmentEntity, (assignment) => assignment.workLocation)
  employeeAssignments!: EmployeeLocationAssignmentEntity[];

  @OneToMany(() => ShiftAssignmentEntity, (assignment) => assignment.workLocation)
  shiftAssignments!: ShiftAssignmentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string | null;
}
