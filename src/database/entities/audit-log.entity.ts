import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CompanyEntity } from './company.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity | null;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser?: UserEntity | null;

  @Column({ name: 'entity_name', type: 'varchar', length: 120 })
  entityName!: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 120 })
  entityId!: string;

  @Column({ type: 'varchar', length: 40 })
  action!: string;

  @Column({ name: 'before_data', type: 'json', nullable: true })
  beforeData?: Record<string, unknown> | null;

  @Column({ name: 'after_data', type: 'json', nullable: true })
  afterData?: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress?: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent?: string | null;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
