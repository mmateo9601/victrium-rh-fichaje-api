import { DataSource } from 'typeorm';

import { TimeEntryAuditEntity } from '../../database/entities/time-entry-audit.entity';
import { TimeEntryBreakEntity } from '../../database/entities/time-entry-break.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { TimeEntrySessionEntity } from '../../database/entities/time-entry-session.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { ClockService } from '../../common/time/clock.service';
import { UsersService } from '../users/users.service';
import { TimeEntryEligibilityService } from './time-entry-eligibility.service';
import { TimeEntriesService } from './time-entries.service';

describe('TimeEntriesService', () => {
  function createService(overrides: Partial<{
    entry: Partial<TimeEntryEntity>;
    currentEntries: TimeEntryEntity[];
    correctedBy: Partial<UserEntity> | null;
  }> = {}) {
    const user = {
      id: 1,
      email: 'ada@example.com',
      numero: 'EMP001',
      nombreEmpleado: 'Ada Lovelace',
      working: false,
      roles: [],
      password: 'secret',
      dni: '12345678A',
      timeEntries: [],
      sessions: [],
      company: { id: 7, name: 'Victrium' },
      employee: {
        id: 21,
        numero: 'EMP001',
        nombreEmpleado: 'Ada Lovelace',
        email: 'ada@example.com',
        dni: '12345678A',
        company: { id: 7, name: 'Victrium' },
        working: false
      }
    } as unknown as UserEntity;

    const entry = {
      id: 10,
      hora: '08:00:00',
      dia: '2026-08-20',
      tipo: 'ENTRADA',
      origen: 'web',
      usuario: user,
      version: 2,
      updatedAt: new Date('2026-08-20T06:00:00.000Z'),
      audits: []
    } as TimeEntryEntity;

    Object.assign(entry, overrides.entry ?? {});

    const currentEntries = overrides.currentEntries ?? [];
    const correctedBy = (overrides.correctedBy ?? user) as UserEntity;

    const auditRepo = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => value),
      find: jest.fn().mockResolvedValue([])
    };

    const sessionRepo = {
      create: jest.fn().mockImplementation((value) => value),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (value) => value),
      update: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null)
      })
    };

    const breakRepo = {
      create: jest.fn().mockImplementation((value) => value),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (value) => value)
    };

    const employeeRepo = {
      save: jest.fn().mockImplementation(async (value) => value),
      update: jest.fn().mockResolvedValue(undefined)
    };

    const timeEntryRepo = {
      create: jest.fn().mockImplementation((value) => value),
      findOne: jest.fn().mockResolvedValue(entry),
      save: jest.fn().mockImplementation(async (value) => ({ ...value, version: value.version + 1 })),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(currentEntries)
      })
    };

    const userRepo = {
      findOne: jest.fn().mockResolvedValue(correctedBy),
      save: jest.fn().mockImplementation(async (value) => value),
      update: jest.fn().mockResolvedValue(undefined)
    };

    const manager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === UserEntity) {
          return userRepo;
        }
        if (entity === TimeEntryEntity) {
          return timeEntryRepo;
        }
        if (entity === TimeEntryAuditEntity) {
          return auditRepo;
        }
        if (entity === TimeEntrySessionEntity) {
          return sessionRepo;
        }
        if (entity === TimeEntryBreakEntity) {
          return breakRepo;
        }
        if (entity === EmployeeEntity) {
          return employeeRepo;
        }
        throw new Error('Unexpected entity');
      })
    };

    const dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => callback(manager))
    } as unknown as DataSource;

    const usersService = {
      findById: jest.fn().mockResolvedValue(user)
    } as unknown as UsersService;

    const clockService = {
      now: jest.fn().mockReturnValue(new Date('2026-08-21T06:00:00.000Z'))
    } as unknown as ClockService;

    const eligibilityService = {
      evaluate: jest.fn().mockResolvedValue({
        canStart: true,
        reason: 'ALLOWED',
        message: 'Puede iniciar la jornada',
        evaluatedAt: '2026-08-21T08:00:00+02:00',
        allowedFrom: null,
        allowedUntil: null,
        scheduledStart: null,
        scheduledEnd: null,
        earlyClockInMinutes: 10,
        companyId: 7,
        companyName: 'Victrium',
        workLocationId: null,
        workLocationName: null,
        workLocationCode: null,
        shiftId: null,
        shiftName: null,
        shiftCode: null
      })
    } as unknown as TimeEntryEligibilityService;

    const tenantScope = {
      assertResourceAccess: jest.fn()
    } as unknown as TenantScopeService;

    const service = new TimeEntriesService(
      dataSource,
      timeEntryRepo as never,
      auditRepo as never,
      sessionRepo as never,
      breakRepo as never,
      usersService,
      tenantScope,
      clockService,
      eligibilityService
    );

    return {
      service,
      dataSource,
      timeEntryRepo,
      auditRepo,
      sessionRepo,
      breakRepo,
      employeeRepo,
      userRepo,
      manager,
      user,
      entry,
      correctedBy,
      clockService,
      eligibilityService
    };
  }

  it('creates a clock in entry and toggles user state', async () => {
    const { service, user } = createService();

    const result = await service.clock(
      1,
      { origen: 'web' },
      {
        userId: 1,
        companyId: 7,
        employeeId: 21,
        roles: ['ROLE_USER'],
        canAccessAll: false
      }
    );

    expect(result.tipo).toBe('ENTRADA');
    expect(user.working).toBe(true);
  });

  it('pauses a session and marks the user as not working', async () => {
    const session = {
      id: 11,
      employeeId: 21,
      usuario: {
        id: 1,
        company: { id: 7, name: 'Victrium' }
      },
      startedAt: new Date('2026-08-21T06:00:00.000Z'),
      finishedAt: null,
      state: 'WORKING',
      source: 'web',
      breaks: [],
      version: 1
    } as unknown as TimeEntrySessionEntity;

    const { service, sessionRepo, breakRepo, employeeRepo, userRepo, user } = createService();
    sessionRepo.findOne.mockResolvedValueOnce(session);
    sessionRepo.findOne.mockResolvedValueOnce({
      ...session,
      breaks: [
        {
          id: 90,
          startedAt: new Date('2026-08-21T06:30:00.000Z'),
          endedAt: null
        }
      ]
    });

    const result = await service.pauseSession(11);

    expect(result.state).toBe('PAUSED');
    expect(user.working).toBe(false);
    expect(user.employee?.working).toBe(false);
    expect(breakRepo.save).toHaveBeenCalledTimes(1);
    expect(employeeRepo.update).toHaveBeenCalledWith(21, { working: false });
    expect(userRepo.update).toHaveBeenCalledWith(1, { working: false });
  });

  it('returns a completed session snapshot when the latest session of the day is already closed', async () => {
    const completedSession = {
      id: 12,
      usuario: {
        id: 1,
        numero: 'EMP001',
        nombreEmpleado: 'Ada Lovelace',
        company: { id: 7, name: 'Victrium' }
      },
      startedAt: new Date('2026-08-21T06:00:00.000Z'),
      finishedAt: new Date('2026-08-21T14:00:00.000Z'),
      state: 'COMPLETED',
      source: 'web',
      breaks: [],
      version: 1
    } as unknown as TimeEntrySessionEntity;

    const { service, sessionRepo } = createService();
    sessionRepo.findOne.mockResolvedValueOnce(null);
    sessionRepo.createQueryBuilder.mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(completedSession)
    });

    const result = await service.current(1, {
      userId: 1,
      companyId: 7,
      employeeId: 21,
      roles: ['ROLE_USER'],
      canAccessAll: false
    });

    expect(result.state).toBe('COMPLETED');
    expect(result.sessionId).toBe(completedSession.id);
  });

  it('returns a visible entry for the authenticated owner', async () => {
    const { service, entry } = createService();

    const result = await service.findVisibleById(10, {
      userId: 1,
      companyId: 7,
      employeeId: null,
      roles: ['ROLE_USER'],
      canAccessAll: false
    });

    expect(result.id).toBe(entry.id);
    expect(result.usuarioNumero).toBe('EMP001');
  });

  it('stores an audit record when a correction is applied', async () => {
    const { service, auditRepo } = createService({
      entry: {
        hora: '08:15:00',
        tipo: 'ENTRADA',
        version: 4
      }
    });

    const result = await service.correct(
      10,
      {
        dia: '2026-08-20',
        hora: '08:30:00',
        tipo: 'ENTRADA',
        motivo: 'Ajuste por incidencia',
        version: 4
      },
      {
        userId: 1,
        companyId: 7,
        employeeId: null,
        roles: ['ROLE_COMPANY_ADMIN'],
        canAccessAll: true
      }
    );

    expect(result.hora).toBe('08:30:00');
    expect(auditRepo.create).toHaveBeenCalledTimes(1);
    expect(auditRepo.save).toHaveBeenCalledTimes(1);
  });
});
