import { DataSource } from 'typeorm';

import { CalendarDayEntity } from '../../database/entities/calendar-day.entity';
import { CalendarEntity } from '../../database/entities/calendar.entity';
import { CalendarsService } from './calendars.service';

describe('CalendarsService', () => {
  it('creates a calendar with its work days', async () => {
    const savedCalendars: CalendarEntity[] = [];
    const savedDays: CalendarDayEntity[] = [];
    const calendarRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => {
        savedCalendars.push(value);
        return { ...value, id: 1 };
      }),
      remove: jest.fn()
    };
    const dayRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (values) => {
        savedDays.push(...values);
        return values.map((value: CalendarDayEntity, index: number) => ({ ...value, id: index + 1 }));
      }),
      delete: jest.fn().mockResolvedValue(undefined)
    };
    const manager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === CalendarEntity) return calendarRepository;
        if (entity === CalendarDayEntity) return dayRepository;
        throw new Error('Unexpected entity');
      })
    };
    const dataSource = { transaction: jest.fn().mockImplementation(async (callback) => callback(manager)) } as unknown as DataSource;
    const service = new CalendarsService(dataSource, calendarRepository as never, dayRepository as never);

    const result = await service.create({
      nombre: 'Calendario 2026',
      year: 2026,
      minutosMasEntrada: 10,
      minutosMenosEntrada: 5,
      active: true,
      days: [
        { dia: '2026-01-05', horaInicio: '09:00', horaFin: '17:00' },
        { dia: '2026-01-06', horaInicio: '09:00', horaFin: '17:00' }
      ]
    });

    expect(result.nombre).toBe('Calendario 2026');
    expect(result.days).toHaveLength(2);
    expect(savedCalendars).toHaveLength(1);
    expect(savedDays).toHaveLength(2);
  });
});
