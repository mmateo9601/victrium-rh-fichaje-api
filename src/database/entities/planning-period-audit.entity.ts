import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { PlanningPeriodEntity } from './planning-period.entity';
import { UserEntity } from './user.entity';

export type PlanningPeriodAuditAction = 'CREATE' | 'UPDATE' | 'PUBLISH' | 'UNPUBLISH';

@Entity({ name: 'planning_period_audits' })
export class PlanningPeriodAuditEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => PlanningPeriodEntity, (planningPeriod) => planningPeriod.audits, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'planning_period_id' })
  planningPeriod!: PlanningPeriodEntity;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy?: UserEntity | null;

  @Column({ type: 'varchar', length: 16 })
  action!: PlanningPeriodAuditAction;

  @Column({ type: 'varchar', length: 16, nullable: true })
  previousStatus?: string | null;

  @Column({ type: 'varchar', length: 16 })
  nextStatus!: string;

  @Column({ type: 'int', nullable: true })
  previousVersion?: number | null;

  @Column({ type: 'int' })
  nextVersion!: number;

  @Column({ type: 'json', nullable: true })
  previousSnapshot?: Record<string, unknown> | null;

  @Column({ type: 'json' })
  nextSnapshot!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
