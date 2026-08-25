import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { PlanningPeriodAuditEntity } from './planning-period-audit.entity';
import { CompanyEntity } from './company.entity';
import { UserEntity } from './user.entity';

export type PlanningPeriodStatus = 'DRAFT' | 'PUBLISHED';

@Entity({ name: 'planning_periods' })
export class PlanningPeriodEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CompanyEntity, (company) => company.planningPeriods, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ type: 'varchar', length: 16, default: 'DRAFT' })
  status!: PlanningPeriodStatus;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'published_by_id' })
  publishedBy?: UserEntity | null;

  @Column({ name: 'locked_at', type: 'datetime', nullable: true })
  lockedAt?: Date | null;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locked_by_id' })
  lockedBy?: UserEntity | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  scope?: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @OneToMany(() => PlanningPeriodAuditEntity, (audit) => audit.planningPeriod)
  audits!: PlanningPeriodAuditEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
