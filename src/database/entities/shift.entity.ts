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

import { CompanyEntity } from './company.entity';
import { ShiftAssignmentEntity } from './shift-assignment.entity';
import { ShiftDayEntity } from './shift-day.entity';
import { ShiftOverrideEntity } from './shift-override.entity';

@Entity({ name: 'turnos' })
@Index(['company', 'code'], { unique: true })
@Index(['company', 'name'], { unique: true })
export class ShiftEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  code!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 24, nullable: true })
  color?: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @ManyToOne(() => CompanyEntity, { eager: true, nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @OneToMany(() => ShiftDayEntity, (day) => day.shift, { eager: true, cascade: true })
  days!: ShiftDayEntity[];

  @OneToMany(() => ShiftAssignmentEntity, (assignment) => assignment.shift)
  assignments!: ShiftAssignmentEntity[];

  @OneToMany(() => ShiftOverrideEntity, (shiftOverride) => shiftOverride.shift)
  overrides!: ShiftOverrideEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
