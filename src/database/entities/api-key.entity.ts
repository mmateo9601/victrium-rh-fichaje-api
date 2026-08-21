import { CreateDateColumn, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { CompanyEntity } from './company.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'api_keys' })
export class ApiKeyEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'key_hash', unique: true, length: 128 })
  keyHash!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255, nullable: true })
  description?: string | null;

  @ManyToOne(() => UserEntity, (user) => user.apiKeys, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => CompanyEntity, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date | null;

  @Column({ name: 'last_used_at', type: 'datetime', nullable: true })
  lastUsedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy?: string | null;

  isValid() {
    if (!this.active) {
      return false;
    }

    if (this.expiresAt && new Date().getTime() > this.expiresAt.getTime()) {
      return false;
    }

    return true;
  }

  updateLastUsed() {
    this.lastUsedAt = new Date();
  }
}
