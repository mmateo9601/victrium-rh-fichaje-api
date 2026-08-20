import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { TimeEntryAuditEntity } from '../../database/entities/time-entry-audit.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ClockTimeEntryDto } from './dto/clock-time-entry.dto';
import { CorrectTimeEntryDto } from './dto/correct-time-entry.dto';
import { TimeEntryAuditDto } from './dto/time-entry-audit.dto';
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
    @InjectRepository(TimeEntryAuditEntity)
    private readonly timeEntryAuditsRepository: Repository<TimeEntryAuditEntity>,
    private readonly usersService: UsersService,
    private readonly tenantScope: TenantScopeService
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

  async findVisibleById(id: number, context: PrincipalTenantContext) {
    const entry = await this.findByIdOrFail(id);
    this.assertVisibleEntry(entry, context);
    return this.toDto(entry);
  }

  async listAudits(id: number, context: PrincipalTenantContext): Promise<TimeEntryAuditDto[]> {
    const entry = await this.findByIdOrFail(id);
    this.assertVisibleEntry(entry, context);

    const audits = await this.timeEntryAuditsRepository.find({
      where: {
        timeEntry: { id: entry.id }
      },
      relations: {
        correctedBy: true,
        timeEntry: true
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC'
      }
    });

    return audits.map((audit) => this.toAuditDto(audit));
  }

  async correct(id: number, dto: CorrectTimeEntryDto, context: PrincipalTenantContext): Promise<TimeEntryDto> {
    return this.dataSource.transaction(async (manager) => {
      const entry = await manager.getRepository(TimeEntryEntity).findOne({
        where: { id },
        relations: {
          usuario: {
            company: true
          }
        },
        lock: { mode: 'pessimistic_write' }
      });

      if (!entry) {
        throw new AppError('TIME_ENTRY_NOT_FOUND', 'Fichaje no encontrado', 404);
      }

      this.assertVisibleEntry(entry, context);

      if (entry.version !== dto.version) {
        throw new AppError('TIME_ENTRY_CONFLICT', 'El fichaje ha cambiado desde que abriste el detalle', 409);
      }

      const nextDia = dto.dia;
      const nextHora = dto.hora;
      const nextTipo = dto.tipo;
      const changed = entry.dia !== nextDia || entry.hora !== nextHora || entry.tipo !== nextTipo;

      if (!changed) {
        throw new AppError('TIME_ENTRY_NO_CHANGES', 'No hay cambios que guardar', 400);
      }

      await this.ensureValidTimeline(manager, entry.usuario.id, entry.id, entry.dia, nextDia, {
        hora: nextHora,
        tipo: nextTipo
      });

      const previousVersion = entry.version;
      const previousSnapshot = this.snapshot(entry);

      entry.dia = nextDia;
      entry.hora = nextHora;
      entry.tipo = nextTipo;

      const saved = await manager.getRepository(TimeEntryEntity).save(entry);
      const correctedBy = await manager.getRepository(UserEntity).findOne({
        where: { id: context.userId }
      });

      if (!correctedBy) {
        throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
      }

      const audit = manager.getRepository(TimeEntryAuditEntity).create({
        timeEntry: saved,
        correctedBy,
        previousDia: previousSnapshot.dia,
        previousHora: previousSnapshot.hora,
        previousTipo: previousSnapshot.tipo,
        newDia: saved.dia,
        newHora: saved.hora,
        newTipo: saved.tipo,
        previousVersion,
        newVersion: saved.version,
        reason: dto.motivo
      });

      await manager.getRepository(TimeEntryAuditEntity).save(audit);

      const refreshed = await manager.getRepository(TimeEntryEntity).findOne({
        where: { id: saved.id },
        relations: {
          usuario: {
            company: true
          }
        }
      });

      if (!refreshed) {
        throw new AppError('TIME_ENTRY_NOT_FOUND', 'Fichaje no encontrado', 404);
      }

      return this.toDto(refreshed);
    });
  }

  private async findByIdOrFail(id: number) {
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

    return entry;
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

  private assertVisibleEntry(entry: TimeEntryEntity, context: PrincipalTenantContext) {
    if (context.canAccessAll) {
      return;
    }

    if (context.roles.includes('ROLE_RRHH')) {
      this.tenantScope.assertResourceAccess(entry.usuario.company?.id, context, entry.usuario.id);
      return;
    }

    if (context.userId === entry.usuario.id) {
      return;
    }

    throw new AppError('FORBIDDEN_CROSS_TENANT', 'Recurso fuera del alcance del usuario', 404);
  }

  private async ensureValidTimeline(
    manager: EntityManager,
    userId: number,
    entryId: number,
    originalDia: string,
    newDia: string,
    nextState: { hora: string; tipo: 'ENTRADA' | 'SALIDA' }
  ) {
    const affectedDays = new Set([originalDia, newDia]);

    for (const day of affectedDays) {
      const entries = await manager.getRepository(TimeEntryEntity)
        .createQueryBuilder('entry')
        .leftJoin('entry.usuario', 'usuario')
        .where('usuario.id = :userId', { userId })
        .andWhere('entry.dia = :day', { day })
        .andWhere('entry.id <> :entryId', { entryId })
        .orderBy('entry.hora', 'ASC')
        .addOrderBy('entry.id', 'ASC')
        .getMany();

      const workingEntries = [...entries];
      if (day === newDia) {
        workingEntries.push({
          id: entryId,
          dia: newDia,
          hora: nextState.hora,
          tipo: nextState.tipo,
          usuario: entries[0]?.usuario ?? ({} as UserEntity),
          origen: '',
          version: 0,
          updatedAt: new Date(),
          audits: []
        } as TimeEntryEntity);
      }

      this.assertDaySequence(day, workingEntries);
    }
  }

  private assertDaySequence(day: string, entries: TimeEntryEntity[]) {
    const ordered = [...entries].sort((a, b) => a.hora.localeCompare(b.hora) || a.id - b.id);

    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index - 1].hora === ordered[index].hora) {
        throw new AppError('TIME_ENTRY_INVALID_SEQUENCE', `Hay dos fichajes a la misma hora en ${day}`, 400);
      }
      if (ordered[index - 1].tipo === ordered[index].tipo) {
        throw new AppError('TIME_ENTRY_INVALID_SEQUENCE', `La secuencia del día ${day} no alterna entrada y salida`, 400);
      }
    }

    if (ordered.length > 0 && ordered[0].tipo !== 'ENTRADA') {
      throw new AppError('TIME_ENTRY_INVALID_SEQUENCE', `El día ${day} debe empezar por una entrada`, 400);
    }
  }

  private snapshot(entry: TimeEntryEntity) {
    return {
      dia: entry.dia,
      hora: entry.hora,
      tipo: entry.tipo
    };
  }

  private toAuditDto(audit: TimeEntryAuditEntity): TimeEntryAuditDto {
    return {
      id: audit.id,
      timeEntryId: audit.timeEntry.id,
      previousDia: audit.previousDia,
      previousHora: audit.previousHora,
      previousTipo: audit.previousTipo,
      newDia: audit.newDia,
      newHora: audit.newHora,
      newTipo: audit.newTipo,
      previousVersion: audit.previousVersion,
      newVersion: audit.newVersion,
      reason: audit.reason,
      createdAt: audit.createdAt.toISOString(),
      correctedById: audit.correctedBy.id,
      correctedByNumero: audit.correctedBy.numero,
      correctedByNombre: audit.correctedBy.nombreEmpleado
    };
  }

  private toDto(entry: TimeEntryEntity): TimeEntryDto {
    return {
      id: entry.id,
      hora: entry.hora,
      dia: entry.dia,
      tipo: entry.tipo,
      origen: entry.origen,
      version: entry.version,
      updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
      usuarioId: entry.usuario.id,
      usuarioNumero: entry.usuario.numero,
      usuarioNombre: entry.usuario.nombreEmpleado,
      companyId: entry.usuario.company?.id ?? null,
      companyName: entry.usuario.company?.name ?? null
    };
  }
}
