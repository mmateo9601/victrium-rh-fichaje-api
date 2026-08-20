import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { CalendarDayEntity } from '../../database/entities/calendar-day.entity';
import { CalendarEntity } from '../../database/entities/calendar.entity';
import { CalendarDayDto } from './dto/calendar-day.dto';
import { CalendarListDto } from './dto/calendar-list.dto';
import { CalendarResponseDto } from './dto/calendar-response.dto';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

@Injectable()
export class CalendarsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CalendarEntity)
    private readonly calendarsRepository: Repository<CalendarEntity>,
    @InjectRepository(CalendarDayEntity)
    private readonly daysRepository: Repository<CalendarDayEntity>
  ) {}

  async create(dto: CreateCalendarDto): Promise<CalendarResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      await this.assertUniqueCalendar(dto.nombre, dto.year, null, manager.getRepository(CalendarEntity));
      const calendar = manager.getRepository(CalendarEntity).create({
        nombre: dto.nombre,
        year: dto.year,
        minutosMasEntrada: dto.minutosMasEntrada,
        minutosMenosEntrada: dto.minutosMenosEntrada,
        active: dto.active ?? false
      });

      const saved = await manager.getRepository(CalendarEntity).save(calendar);
      const days = await this.buildDays(dto.days, saved, manager);
      saved.days = await manager.getRepository(CalendarDayEntity).save(days);
      return this.toDto(saved);
    });
  }

  async list(query: { search?: string; active?: string; year?: string } = {}) {
    const qb = this.calendarsRepository
      .createQueryBuilder('calendar')
      .leftJoinAndSelect('calendar.days', 'day');

    if (query.search) {
      qb.andWhere('(calendar.nombre LIKE :search)', { search: `%${query.search}%` });
    }

    if (query.active !== undefined) {
      const active = query.active === 'true' ? true : query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('calendar.active = :active', { active });
      }
    }

    if (query.year) {
      qb.andWhere('calendar.year = :year', { year: Number(query.year) });
    }

    qb.orderBy('calendar.year', 'DESC').addOrderBy('calendar.nombre', 'ASC').distinct(true);
    const calendars = await qb.getMany();
    return calendars.map((calendar) => this.toListDto(calendar));
  }

  async findByIdOrFail(id: number) {
    const calendar = await this.calendarsRepository.findOne({
      where: { id },
      relations: { days: true }
    });

    if (!calendar) {
      throw new AppError('CALENDAR_NOT_FOUND', 'Calendario no encontrado', 404);
    }

    return calendar;
  }

  async getVisibleCalendar(id: number) {
    const calendar = await this.findByIdOrFail(id);
    return this.toDto(calendar);
  }

  async update(id: number, dto: UpdateCalendarDto) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CalendarEntity);
      const calendar = await repository.findOne({
        where: { id },
        relations: { days: true }
      });

      if (!calendar) {
        throw new AppError('CALENDAR_NOT_FOUND', 'Calendario no encontrado', 404);
      }

      if (dto.nombre !== undefined || dto.year !== undefined) {
        await this.assertUniqueCalendar(dto.nombre ?? calendar.nombre, dto.year ?? calendar.year, calendar.id, repository);
      }

      if (dto.nombre !== undefined) calendar.nombre = dto.nombre;
      if (dto.year !== undefined) calendar.year = dto.year;
      if (dto.minutosMasEntrada !== undefined) calendar.minutosMasEntrada = dto.minutosMasEntrada;
      if (dto.minutosMenosEntrada !== undefined) calendar.minutosMenosEntrada = dto.minutosMenosEntrada;
      if (dto.active !== undefined) calendar.active = dto.active;

      if (dto.days) {
        if (calendar.days?.length) {
          await manager.getRepository(CalendarDayEntity).delete({ id: In(calendar.days.map((day) => day.id)) });
        }
      }

      const saved = await repository.save(calendar);
      if (dto.days) {
        const days = await this.buildDays(dto.days, saved, manager);
        saved.days = await manager.getRepository(CalendarDayEntity).save(days);
      }
      return this.toDto(saved);
    });
  }

  async delete(id: number) {
    const calendar = await this.findByIdOrFail(id);
    await this.calendarsRepository.remove(calendar);
  }

  private async buildDays(
    days: CalendarDayDto[],
    calendar: CalendarEntity | null,
    manager: EntityManager
  ) {
    const dayRepository = manager.getRepository(CalendarDayEntity);
    return days.map((day) =>
      dayRepository.create({
        dia: day.dia,
        horaInicio: day.horaInicio,
        horaFin: day.horaFin,
        calendar: calendar ?? undefined
      })
    );
  }

  private async assertUniqueCalendar(
    nombre: string,
    year: number,
    currentId: number | null,
    repository: Repository<CalendarEntity>
  ) {
    const exists = await repository.findOne({
      where: [{ nombre }, { year }]
    });

    if (exists && exists.id !== currentId) {
      throw new AppError('CALENDAR_ALREADY_EXISTS', 'Calendario ya existente', 409);
    }
  }

  private toListDto(calendar: CalendarEntity): CalendarListDto {
    return {
      id: calendar.id,
      nombre: calendar.nombre,
      year: calendar.year,
      minutosMasEntrada: calendar.minutosMasEntrada,
      minutosMenosEntrada: calendar.minutosMenosEntrada,
      active: calendar.active,
      daysCount: calendar.days?.length ?? 0
    };
  }

  private toDto(calendar: CalendarEntity): CalendarResponseDto {
    return {
      id: calendar.id,
      nombre: calendar.nombre,
      year: calendar.year,
      minutosMasEntrada: calendar.minutosMasEntrada,
      minutosMenosEntrada: calendar.minutosMenosEntrada,
      active: calendar.active,
      days: (calendar.days ?? []).map((day) => ({
        id: day.id,
        dia: day.dia,
        horaInicio: day.horaInicio,
        horaFin: day.horaFin
      }))
    };
  }
}
