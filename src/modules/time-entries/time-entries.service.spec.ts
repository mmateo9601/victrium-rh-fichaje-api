import { DataSource } from 'typeorm';

import { TimeEntryAuditEntity } from '../../database/entities/time-entry-audit.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { UsersService } from '../users/users.service';
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
      company: { id: 7, name: 'Victrium' }
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
      save: jest.fn().mockImplementation(async (value) => value)
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
        throw new Error('Unexpected entity');
      })
    };

    const dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => callback(manager))
    } as unknown as DataSource;

    const usersService = {
      findById: jest.fn().mockResolvedValue(user)
    } as unknown as UsersService;

    const tenantScope = {
      assertResourceAccess: jest.fn()
    } as unknown as TenantScopeService;

    const service = new TimeEntriesService(
      dataSource,
      timeEntryRepo as never,
      auditRepo as never,
      usersService,
      tenantScope
    );

    return { service, dataSource, timeEntryRepo, auditRepo, userRepo, manager, user, entry, correctedBy };
  }

  it('creates a clock in entry and toggles user state', async () => {
    const { service, user } = createService();

    const result = await service.clock(1, { origen: 'web' });

    expect(result.tipo).toBe('ENTRADA');
    expect(user.working).toBe(true);
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
        roles: ['ROLE_ADMIN'],
        canAccessAll: true
      }
    );

    expect(result.hora).toBe('08:30:00');
    expect(auditRepo.create).toHaveBeenCalledTimes(1);
    expect(auditRepo.save).toHaveBeenCalledTimes(1);
  });
});
