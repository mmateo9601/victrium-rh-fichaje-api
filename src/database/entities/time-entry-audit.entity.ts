import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { TimeEntryEntity } from './time-entry.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'fichaje_audits' })
@Index(['timeEntry'])
export class TimeEntryAuditEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => TimeEntryEntity, (timeEntry) => timeEntry.audits, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'time_entry_id' })
  timeEntry!: TimeEntryEntity;

  @ManyToOne(() => UserEntity, { eager: true, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'corrected_by_id' })
  correctedBy!: UserEntity;

  @Column({ type: 'date' })
  previousDia!: string;

  @Column({ type: 'time' })
  previousHora!: string;

  @Column()
  previousTipo!: 'ENTRADA' | 'SALIDA';

  @Column({ type: 'date' })
  newDia!: string;

  @Column({ type: 'time' })
  newHora!: string;

  @Column()
  newTipo!: 'ENTRADA' | 'SALIDA';

  @Column({ type: 'int' })
  previousVersion!: number;

  @Column({ type: 'int' })
  newVersion!: number;

  @Column({ type: 'text' })
  reason!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
