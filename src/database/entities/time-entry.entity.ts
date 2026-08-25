import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

import { TimeEntryAuditEntity } from './time-entry-audit.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'fichajes' })
@Index(['usuario', 'dia', 'hora'])
export class TimeEntryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'time' })
  hora!: string;

  @Column({ type: 'date' })
  dia!: string;

  @Column()
  tipo!: 'ENTRADA' | 'SALIDA';

  @Column()
  origen!: string;

  @Column({ name: 'company_id', type: 'int', nullable: true })
  companyId?: number | null;

  @Column({ name: 'employee_id', type: 'int', nullable: true })
  employeeId?: number | null;

  @Column({ name: 'session_id', type: 'int', nullable: true })
  sessionId?: number | null;

  @Column({ name: 'work_location_id', type: 'int', nullable: true })
  workLocationId?: number | null;

  @Column({ name: 'shift_id', type: 'int', nullable: true })
  shiftId?: number | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  timezone?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: string | null;

  @Column({ name: 'source_device', type: 'varchar', length: 128, nullable: true })
  sourceDevice?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @VersionColumn()
  version!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.timeEntries, { eager: true, nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: UserEntity;

  @OneToMany(() => TimeEntryAuditEntity, (audit) => audit.timeEntry)
  audits!: TimeEntryAuditEntity[];
}
