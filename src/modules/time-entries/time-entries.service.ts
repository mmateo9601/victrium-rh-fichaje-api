import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { ClockService } from '../../common/time/clock.service';
import { getTimeZoneDayBounds } from '../../common/time/timezone.utils';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { TimeEntryAuditEntity } from '../../database/entities/time-entry-audit.entity';
import { TimeEntryBreakEntity } from '../../database/entities/time-entry-break.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { TimeEntrySessionEntity } from '../../database/entities/time-entry-session.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { TimeEntryEligibilityService } from './time-entry-eligibility.service';
import { ClockTimeEntryDto } from './dto/clock-time-entry.dto';
import { CorrectTimeEntryDto } from './dto/correct-time-entry.dto';
import { TimeEntryEligibilityDto } from './dto/time-entry-eligibility.dto';
import { TimeEntryAuditDto } from './dto/time-entry-audit.dto';
import { TimeEntryDto } from './dto/time-entry.dto';
import { TimeSessionCurrentDto } from './dto/time-session-current.dto';

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
    @InjectRepository(TimeEntrySessionEntity)
    private readonly timeEntrySessionsRepository: Repository<TimeEntrySessionEntity>,
    @InjectRepository(TimeEntryBreakEntity)
    private readonly timeEntryBreaksRepository: Repository<TimeEntryBreakEntity>,
    private readonly usersService: UsersService,
    private readonly tenantScope: TenantScopeService,
    private readonly clockService: ClockService,
    private readonly eligibilityService: TimeEntryEligibilityService
  ) {}

  async clock(userId: number, dto: ClockTimeEntryDto, context?: PrincipalTenantContext): Promise<TimeEntryDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    const current = await this.getCurrentSessionSnapshot(user);
    if (current.activeSession) {
      if (context) {
        this.assertVisibleSession(current.activeSession, context);
      }
      const finished = await this.finishSession(current.activeSession.id, context);
      return this.toTimeEntryDtoFromSession(finished, 'SALIDA');
    }

    if (current.latestSessionToday?.finishedAt) {
      throw new AppError('SESSION_COMPLETED', 'La jornada de hoy ya está cerrada', 409);
    }

    if (!context) {
      throw new AppError('CLOCK_IN_FORBIDDEN', 'No se pudo validar el acceso a la jornada', 409);
    }

    const eligibility = await this.eligibilityService.evaluate(user, context, {
      activeSession: null,
      latestSessionToday: current.latestSessionToday
    });
    if (!eligibility.canStart) {
      throw new AppError(eligibility.reason, eligibility.message ?? 'No es posible iniciar la jornada', 409);
    }

    const started = await this.start(userId, { origen: dto.origen ?? 'web' }, context);
    return this.toTimeEntryDtoFromSession(started, 'ENTRADA');
  }

  async current(userId: number, context: PrincipalTenantContext): Promise<TimeSessionCurrentDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    const snapshot = await this.getCurrentSessionSnapshot(user);
    const eligibility = await this.eligibilityService.evaluate(user, context, {
      activeSession: snapshot.activeSession,
      latestSessionToday: snapshot.latestSessionToday
    });

    if (snapshot.activeSession) {
      this.assertVisibleSession(snapshot.activeSession, context);
      return this.toCurrentSessionDto(snapshot.activeSession, null, eligibility);
    }

    if (snapshot.latestSessionToday?.finishedAt) {
      this.assertVisibleSession(snapshot.latestSessionToday, context);
      return this.toCurrentSessionDto(snapshot.latestSessionToday, null, eligibility);
    }

    return {
      state: 'NOT_STARTED',
      sessionId: null,
      startedAt: null,
      finishedAt: null,
      activeBreak: null,
      workedSeconds: 0,
      breakSeconds: 0,
      usuarioId: user.id,
      usuarioNumero: user.numero,
      usuarioNombre: user.nombreEmpleado,
      companyId: user.company?.id ?? null,
      companyName: user.company?.name ?? null,
      eligibility
    };
  }

  async eligibility(userId: number, context: PrincipalTenantContext): Promise<TimeEntryEligibilityDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    const snapshot = await this.getCurrentSessionSnapshot(user);
    return this.eligibilityService.evaluate(user, context, {
      activeSession: snapshot.activeSession,
      latestSessionToday: snapshot.latestSessionToday
    });
  }

  async start(userId: number, dto: ClockTimeEntryDto, context?: PrincipalTenantContext): Promise<TimeSessionCurrentDto> {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.lockUser(manager, userId);
      const activeSession = await this.findActiveSession(userId, manager);
      const latestSessionToday = activeSession ?? (await this.findLatestSessionToday(user, manager));
      if (activeSession) {
        if (context) {
          this.assertVisibleSession(activeSession, context);
        }
        throw new AppError('SESSION_ALREADY_ACTIVE', 'Ya existe una jornada activa', 409);
      }

      if (context) {
        const eligibility = await this.eligibilityService.evaluate(user, context, {
          activeSession: null,
          latestSessionToday
        });
        if (!eligibility.canStart) {
          throw new AppError(eligibility.reason, eligibility.message ?? 'No es posible iniciar la jornada', 409);
        }
      }

      const now = this.clockService.now();
      const session = await manager.getRepository(TimeEntrySessionEntity).save(
        manager.getRepository(TimeEntrySessionEntity).create({
          usuario: user,
          companyId: user.company?.id ?? user.employee?.company?.id ?? null,
          employeeId: user.employee?.id ?? null,
          startedAt: now,
          finishedAt: null,
          state: 'WORKING',
          source: dto.origen ?? 'web'
        })
      );

      await this.syncWorkingState(manager, user, true);
      user.ultimoFichaje = `${formatMadridDate(now)} ${formatMadridTime(now)} - ENTRADA`;
      await manager.getRepository(UserEntity).save(user);

      return this.toCurrentSessionDto({ ...session, breaks: [] } as TimeEntrySessionEntity);
    });
  }

  async pause(userId: number, context?: PrincipalTenantContext): Promise<TimeSessionCurrentDto> {
    const session = await this.sessionOrThrow(userId, context);
    return this.pauseSession(session.id, context);
  }

  async pauseSession(sessionId: number, context?: PrincipalTenantContext): Promise<TimeSessionCurrentDto> {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.findSessionByIdOrFail(sessionId, manager);
      if (!session) {
        throw new AppError('SESSION_NOT_FOUND', 'No hay una jornada activa', 404);
      }
      if (session.finishedAt) {
        throw new AppError('SESSION_COMPLETED', 'La jornada ya está finalizada', 409);
      }
      if (context) {
        this.assertVisibleSession(session, context);
      }
      if (session.state === 'PAUSED') {
        throw new AppError('SESSION_ALREADY_PAUSED', 'La jornada ya está en pausa', 409);
      }

      const now = this.clockService.now();
      const breakItem = await manager.getRepository(TimeEntryBreakEntity).save(
        manager.getRepository(TimeEntryBreakEntity).create({
          session: { id: session.id } as TimeEntrySessionEntity,
          startedAt: now,
          endedAt: null
        })
      );

      session.state = 'PAUSED';
      await manager.getRepository(TimeEntrySessionEntity).save(session);
      await manager.getRepository(UserEntity).update(session.usuario.id, { working: false });
      if (session.employeeId) {
        await manager.getRepository(EmployeeEntity).update(session.employeeId, { working: false });
      }

      const refreshed = await this.findSessionByIdOrFail(session.id, manager);
      return this.toCurrentSessionDto(refreshed, breakItem);
    });
  }

  async resume(userId: number, context?: PrincipalTenantContext): Promise<TimeSessionCurrentDto> {
    const session = await this.sessionOrThrow(userId, context);
    return this.resumeSession(session.id, context);
  }

  async resumeSession(sessionId: number, context?: PrincipalTenantContext): Promise<TimeSessionCurrentDto> {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.findSessionByIdOrFail(sessionId, manager);
      if (!session) {
        throw new AppError('SESSION_NOT_FOUND', 'No hay una jornada activa', 404);
      }
      if (session.finishedAt) {
        throw new AppError('SESSION_COMPLETED', 'La jornada ya está finalizada', 409);
      }
      if (context) {
        this.assertVisibleSession(session, context);
      }
      if (session.state !== 'PAUSED') {
        throw new AppError('SESSION_NOT_PAUSED', 'La jornada no está en pausa', 409);
      }

      const activeBreak = await manager.getRepository(TimeEntryBreakEntity).findOne({
        where: { session: { id: session.id }, endedAt: IsNull() },
        order: { startedAt: 'DESC', id: 'DESC' }
      });

      if (!activeBreak) {
        throw new AppError('SESSION_BREAK_NOT_FOUND', 'No hay una pausa activa', 409);
      }

      activeBreak.endedAt = this.clockService.now();
      await manager.getRepository(TimeEntryBreakEntity).save(activeBreak);

      session.state = 'WORKING';
      await manager.getRepository(TimeEntrySessionEntity).save(session);
      await manager.getRepository(UserEntity).update(session.usuario.id, { working: true });
      if (session.employeeId) {
        await manager.getRepository(EmployeeEntity).update(session.employeeId, { working: true });
      }

      const refreshed = await this.findSessionByIdOrFail(session.id, manager);
      return this.toCurrentSessionDto(refreshed);
    });
  }

  async finish(userId: number, context?: PrincipalTenantContext): Promise<TimeSessionCurrentDto> {
    const session = await this.sessionOrThrow(userId, context);
    return this.finishSession(session.id, context);
  }

  async finishSession(sessionId: number, context?: PrincipalTenantContext): Promise<TimeSessionCurrentDto> {
    return this.dataSource.transaction(async (manager) => {
      const session = await this.findSessionByIdOrFail(sessionId, manager);
      if (!session) {
        throw new AppError('SESSION_NOT_FOUND', 'No hay una jornada activa', 404);
      }
      if (session.finishedAt) {
        throw new AppError('SESSION_COMPLETED', 'La jornada ya está finalizada', 409);
      }
      if (context) {
        this.assertVisibleSession(session, context);
      }

      const activeBreak = await manager.getRepository(TimeEntryBreakEntity).findOne({
        where: { session: { id: session.id }, endedAt: IsNull() },
        order: { startedAt: 'DESC', id: 'DESC' }
      });

      if (activeBreak) {
        activeBreak.endedAt = new Date();
        await manager.getRepository(TimeEntryBreakEntity).save(activeBreak);
      }

      session.finishedAt = this.clockService.now();
      session.state = 'COMPLETED';
      await manager.getRepository(TimeEntrySessionEntity).save(session);

      const lastClockOut = `${formatMadridDate(session.finishedAt)} ${formatMadridTime(session.finishedAt)} - SALIDA`;
      await manager.getRepository(UserEntity).update(session.usuario.id, { working: false });
      if (session.employeeId) {
        await manager.getRepository(EmployeeEntity).update(session.employeeId, { working: false });
      }
      await manager.getRepository(UserEntity).update(session.usuario.id, { ultimoFichaje: lastClockOut });

      const refreshed = await this.findSessionByIdOrFail(session.id, manager);
      return this.toCurrentSessionDto(refreshed);
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

  private async lockUser(manager: EntityManager, userId: number) {
    const user = await manager.getRepository(UserEntity).findOne({
      where: { id: userId },
      relations: { roles: true, company: true, employee: true },
      lock: { mode: 'pessimistic_write' }
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    return user;
  }

  private async syncWorkingState(manager: EntityManager, user: UserEntity, working: boolean) {
    user.working = working;
    await manager.getRepository(UserEntity).save(user);

    if (user.employee) {
      user.employee.working = working;
      await manager.getRepository(EmployeeEntity).save(user.employee);
    }
  }

  private async findActiveSession(userId: number, manager?: EntityManager) {
    const repository = manager ? manager.getRepository(TimeEntrySessionEntity) : this.timeEntrySessionsRepository;
    return repository.findOne({
      where: {
        usuario: { id: userId },
        finishedAt: IsNull()
      },
      relations: {
        usuario: {
          company: true
        },
        breaks: true
      },
      order: {
        startedAt: 'DESC',
        id: 'DESC'
      }
    });
  }

  private resolveCompanyTimeZone(user: UserEntity) {
    return user.company?.timezone ?? user.employee?.company?.timezone ?? 'Europe/Madrid';
  }

  private async findLatestSessionToday(user: UserEntity, manager?: EntityManager) {
    const repository = manager ? manager.getRepository(TimeEntrySessionEntity) : this.timeEntrySessionsRepository;
    const bounds = getTimeZoneDayBounds(this.clockService.now(), this.resolveCompanyTimeZone(user));
    return repository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.usuario', 'usuario')
      .leftJoinAndSelect('usuario.company', 'company')
      .leftJoinAndSelect('session.breaks', 'breaks')
      .where('usuario.id = :userId', { userId: user.id })
      .andWhere('session.startedAt < :dayEnd', { dayEnd: bounds.end })
      .andWhere('(session.finishedAt IS NULL OR session.finishedAt >= :dayStart)', { dayStart: bounds.start })
      .orderBy('session.startedAt', 'DESC')
      .addOrderBy('session.id', 'DESC')
      .getOne();
  }

  private async findSessionByIdOrFail(id: number, manager?: EntityManager) {
    const repository = manager ? manager.getRepository(TimeEntrySessionEntity) : this.timeEntrySessionsRepository;
    const session = await repository.findOne({
      where: { id },
      relations: {
        usuario: {
          company: true
        },
        breaks: true
      }
    });

    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Jornada no encontrada', 404);
    }

    return session;
  }

  private assertVisibleSession(session: TimeEntrySessionEntity, context: PrincipalTenantContext) {
    if (context.canAccessAll) {
      return;
    }

    if (context.roles.includes('ROLE_RRHH')) {
      this.tenantScope.assertResourceAccess(session.usuario.company?.id, context, session.usuario.id);
      return;
    }

    if (context.userId === session.usuario.id) {
      return;
    }

    throw new AppError('FORBIDDEN_CROSS_TENANT', 'Recurso fuera del alcance del usuario', 404);
  }

  private calculateBreakSeconds(session: TimeEntrySessionEntity, now: Date) {
    return (session.breaks ?? []).reduce((accumulator, breakItem) => {
      if (!breakItem.endedAt) {
        return accumulator + Math.floor((now.getTime() - new Date(breakItem.startedAt).getTime()) / 1000);
      }
      return accumulator + Math.floor((new Date(breakItem.endedAt).getTime() - new Date(breakItem.startedAt).getTime()) / 1000);
    }, 0);
  }

  private calculateWorkedSeconds(session: TimeEntrySessionEntity, now: Date) {
    const end = session.finishedAt ? new Date(session.finishedAt) : now;
    const totalSeconds = Math.max(0, Math.floor((end.getTime() - new Date(session.startedAt).getTime()) / 1000));
    return Math.max(0, totalSeconds - this.calculateBreakSeconds(session, now));
  }

  private findActiveBreak(session: TimeEntrySessionEntity) {
    return [...(session.breaks ?? [])]
      .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime() || right.id - left.id)
      .find((breakItem) => !breakItem.endedAt) ?? null;
  }

  private toCurrentSessionDto(
    session: TimeEntrySessionEntity,
    activeBreakOverride?: TimeEntryBreakEntity | null,
    eligibility: TimeSessionCurrentDto['eligibility'] = null
  ): TimeSessionCurrentDto {
    const activeBreak = activeBreakOverride ?? this.findActiveBreak(session);
    const now = this.clockService.now();
    return {
      state: activeBreak ? 'PAUSED' : session.finishedAt ? 'COMPLETED' : 'WORKING',
      sessionId: session.id,
      startedAt: session.startedAt.toISOString(),
      finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
      activeBreak: activeBreak
        ? {
            id: activeBreak.id,
            startedAt: activeBreak.startedAt.toISOString(),
            endedAt: activeBreak.endedAt ? activeBreak.endedAt.toISOString() : null,
            seconds: Math.max(0, Math.floor(((activeBreak.endedAt ? activeBreak.endedAt : now).getTime() - new Date(activeBreak.startedAt).getTime()) / 1000))
          }
        : null,
      workedSeconds: this.calculateWorkedSeconds(session, now),
      breakSeconds: this.calculateBreakSeconds(session, now),
      usuarioId: session.usuario.id,
      usuarioNumero: session.usuario.numero,
      usuarioNombre: session.usuario.nombreEmpleado,
      companyId: session.usuario.company?.id ?? null,
      companyName: session.usuario.company?.name ?? null,
      eligibility
    };
  }

  private toTimeEntryDtoFromSession(session: TimeSessionCurrentDto, tipo: 'ENTRADA' | 'SALIDA'): TimeEntryDto {
    const timestamp = tipo === 'ENTRADA' ? session.startedAt : session.finishedAt ?? session.startedAt;
    const date = timestamp ? new Date(timestamp) : new Date();
    return {
      id: session.sessionId ?? 0,
      hora: formatMadridTime(date),
      dia: formatMadridDate(date),
      tipo,
      origen: 'web',
      version: 1,
      updatedAt: timestamp,
      usuarioId: session.usuarioId,
      usuarioNumero: session.usuarioNumero,
      usuarioNombre: session.usuarioNombre,
      companyId: session.companyId,
      companyName: session.companyName
    };
  }

  private async sessionOrThrow(userId: number, context?: PrincipalTenantContext) {
    const session = await this.findActiveSession(userId);
    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'No hay una jornada activa', 404);
    }
    if (context) {
      this.assertVisibleSession(session, context);
    }
    return session;
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

  private async getCurrentSessionSnapshot(user: UserEntity) {
    const activeSession = await this.findActiveSession(user.id);
    const latestSessionToday = activeSession ?? (await this.findLatestSessionToday(user));
    return {
      activeSession,
      latestSessionToday
    };
  }
}
