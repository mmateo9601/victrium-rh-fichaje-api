import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext } from '../../common/tenant/tenant-scope.service';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ClockTimeEntryDto } from './dto/clock-time-entry.dto';
import { TimeEntryDto } from './dto/time-entry.dto';

function formatMadridDate(now: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}

function formatMadridTime(now: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
}

@Injectable()
export class TimeEntriesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TimeEntryEntity)
    private readonly timeEntriesRepository: Repository<TimeEntryEntity>,
    private readonly usersService: UsersService
  ) {}

  async clock(userId: number, dto: ClockTimeEntryDto): Promise<TimeEntryDto> {
    const now = new Date();
    const day = formatMadridDate(now);
    const time = formatMadridTime(now);

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(UserEntity).findOne({
        where: { id: userId },
        relations: { roles: true },
        lock: { mode: 'pessimistic_write' }
      });

      if (!user) {
        throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
      }

      const tipo = user.working ? 'SALIDA' : 'ENTRADA';
      user.working = !user.working;
      user.ultimoFichaje = `${day} ${time} - ${tipo}`;

      const entry = manager.getRepository(TimeEntryEntity).create({
        hora: time,
        dia: day,
        tipo,
        origen: dto.origen ?? 'web',
        usuario: user
      });

      await manager.getRepository(TimeEntryEntity).save(entry);
      await manager.getRepository(UserEntity).save(user);

      return this.toDto(entry);
    });
  }

  async list(
    query: PaginationQueryDto & { search?: string; numeroUsuario?: string; nombreUsuario?: string; tipo?: string; from?: string; to?: string },
    context: PrincipalTenantContext
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const allowedSortFields = new Set(['id', 'dia', 'hora', 'tipo', 'origen']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? (query.sort as string) : 'dia';
    const order = query.order ?? 'desc';

    const qb = this.timeEntriesRepository
      .createQueryBuilder('fichaje')
      .leftJoinAndSelect('fichaje.usuario', 'usuario')
      .leftJoinAndSelect('usuario.company', 'company');

    if (query.search) {
      qb.andWhere(
        '(usuario.numero LIKE :search OR usuario.nombreEmpleado LIKE :search OR usuario.email LIKE :search OR fichaje.origen LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.numeroUsuario) {
      qb.andWhere('usuario.numero = :numeroUsuario', { numeroUsuario: query.numeroUsuario });
    }
    if (query.nombreUsuario) {
      qb.andWhere('usuario.nombreEmpleado LIKE :nombreUsuario', { nombreUsuario: `%${query.nombreUsuario}%` });
    }
    if (query.tipo) {
      qb.andWhere('fichaje.tipo = :tipo', { tipo: query.tipo });
    }
    if (query.from) {
      qb.andWhere('fichaje.dia >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('fichaje.dia <= :to', { to: query.to });
    }

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.orderBy(`fichaje.${sortField}`, order.toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [entries, total] = await qb.getManyAndCount();

    return buildPaginatedResult(entries.map((entry) => this.toDto(entry)), total, page, pageSize);
  }

  async findById(id: number) {
    const entry = await this.timeEntriesRepository.findOne({
      where: { id },
      relations: {
        usuario: {
          company: true
        }
      }
    });
    if (!entry) {
      throw new AppError('TIME_ENTRY_NOT_FOUND', 'Fichaje no encontrado', 404);
    }

    return this.toDto(entry);
  }

  async findMine(userId: number, query: PaginationQueryDto & { search?: string; tipo?: string; from?: string; to?: string }, context: PrincipalTenantContext) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    return this.list({
      ...query,
      numeroUsuario: user.numero
    }, context);
  }

  private toDto(entry: TimeEntryEntity): TimeEntryDto {
    return {
      id: entry.id,
      hora: entry.hora,
      dia: entry.dia,
      tipo: entry.tipo,
      origen: entry.origen,
      usuarioId: entry.usuario.id,
      usuarioNumero: entry.usuario.numero,
      usuarioNombre: entry.usuario.nombreEmpleado,
      companyId: entry.usuario.company?.id ?? null,
      companyName: entry.usuario.company?.name ?? null
    };
  }
}
