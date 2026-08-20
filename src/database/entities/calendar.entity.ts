import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { CalendarDayEntity } from './calendar-day.entity';
import { EmployeeEntity } from './employee.entity';

@Entity({ name: 'calendarios' })
@Index(['nombre'], { unique: true })
@Index(['year'], { unique: true })
export class CalendarEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ type: 'boolean', default: false })
  active!: boolean;

  @Column({ type: 'int' })
  year!: number;

  @Column({ name: 'minutos_mas_entrada', type: 'int' })
  minutosMasEntrada!: number;

  @Column({ name: 'minutos_menos_entrada', type: 'int' })
  minutosMenosEntrada!: number;

  @OneToMany(() => CalendarDayEntity, (day) => day.calendar, {
    eager: true,
    cascade: true
  })
  days!: CalendarDayEntity[];

  @OneToMany(() => EmployeeEntity, (employee) => employee.calendar)
  employees!: EmployeeEntity[];
}
