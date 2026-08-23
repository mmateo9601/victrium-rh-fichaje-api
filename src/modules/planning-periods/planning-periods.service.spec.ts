import { PlanningPeriodsService } from './planning-periods.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { PlanningPeriodEntity } from '../../database/entities/planning-period.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';

describe('PlanningPeriodsService', () => {
  function createService(overrides: Partial<{
    period: Partial<PlanningPeriodEntity> | null;
    currentUser: Partial<UserEntity> | null;
    findOneResult: PlanningPeriodEntity | null;
  }> = {}) {
    const company = { id: 7, name: 'Victrium', code: 'VIC' } as CompanyEntity;
    const period = {
      id: 11,
      company,
      name: 'Planificación agosto',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      status: 'DRAFT',
      version: 1,
      publishedAt: null,
      publishedBy: null,
      notes: null,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z')
    } as PlanningPeriodEntity;

    Object.assign(period, overrides.period ?? {});

    const currentUser = {
      id: 1,
      numero: 'EMP001',
      nombreEmpleado: 'Ada Lovelace'
    } as UserEntity;

    const companyRepo = {
      findOne: jest.fn().mockResolvedValue(company)
    };

    const periodRepo = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => value),
      findOne: jest.fn().mockResolvedValue(overrides.findOneResult !== undefined ? overrides.findOneResult : period),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[period], 1])
      })
    };

    const auditRepo = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => value),
      find: jest.fn().mockResolvedValue([])
    };

    const userRepo = {
      findOne: jest.fn().mockResolvedValue(overrides.currentUser === null ? null : currentUser)
    };

    const tenantScope = {
      applyCompanyScope: jest.fn((qb) => qb),
      assertResourceAccess: jest.fn()
    } as unknown as TenantScopeService;

    const service = new PlanningPeriodsService(
      periodRepo as never,
      auditRepo as never,
      companyRepo as never,
      userRepo as never,
      tenantScope
    );

    return { service, periodRepo, auditRepo, companyRepo, userRepo, tenantScope, period, company, currentUser };
  }

  it('creates a planning period in draft state', async () => {
    const { service, periodRepo, auditRepo, company } = createService({ findOneResult: null });

    const result = await service.create(
      {
        companyId: company.id,
        name: 'Planificación septiembre',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        notes: 'Periodo inicial'
      },
      {
        userId: 1,
        companyId: company.id,
        employeeId: null,
        roles: ['ROLE_COMPANY_ADMIN'],
        canAccessAll: false
      }
    );

    expect(periodRepo.save).toHaveBeenCalled();
    expect(auditRepo.save).toHaveBeenCalled();
    expect(result.status).toBe('DRAFT');
    expect(result.name).toBe('Planificación septiembre');
  });

  it('publishes a draft period and stores the publisher', async () => {
    const { service, periodRepo, auditRepo } = createService();

    const result = await service.publish(11, {
      userId: 1,
      companyId: 7,
      employeeId: null,
      roles: ['ROLE_COMPANY_ADMIN'],
      canAccessAll: false
    });

    expect(periodRepo.save).toHaveBeenCalled();
    expect(auditRepo.save).toHaveBeenCalled();
    expect(result.status).toBe('PUBLISHED');
    expect(result.publishedByNumero).toBe('EMP001');
  });
});
