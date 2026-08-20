import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CalendarEntity } from './calendar.entity';

@Entity({ name: 'dias_laborables' })
@Index(['dia'], { unique: true })
export class CalendarDayEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  dia!: string;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio!: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin!: string;

  @ManyToOne(() => CalendarEntity, (calendar) => calendar.days, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'calendario_id' })
  calendar!: CalendarEntity;
}
