import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { CalendarDayEntity } from './calendar-day.entity';
import { CompanyEntity } from './company.entity';
import { EmployeeEntity } from './employee.entity';
import { WorkLocationEntity } from './work-location.entity';

@Entity({ name: 'calendarios' })
@Index(['nombre'], { unique: true })
@Index(['year'], { unique: true })
export class CalendarEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @ManyToOne(() => CompanyEntity, (company) => company.calendars, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity | null;

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

  @OneToMany(() => WorkLocationEntity, (workLocation) => workLocation.calendar)
  workLocations!: WorkLocationEntity[];
}
