import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';

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

  @ManyToOne(() => UserEntity, (user) => user.timeEntries, { eager: true, nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: UserEntity;
}
