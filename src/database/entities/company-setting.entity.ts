import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

import { CompanyEntity } from './company.entity';

@Entity({ name: 'company_settings' })
@Index(['company', 'settingKey'], { unique: true })
export class CompanySettingEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column({ name: 'setting_key', type: 'varchar', length: 120 })
  settingKey!: string;

  @Column({ name: 'setting_value', type: 'json' })
  settingValue!: Record<string, unknown>;

  @Column({ name: 'data_type', type: 'varchar', length: 40, nullable: true })
  dataType?: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
