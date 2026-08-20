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
