import { ReportsService } from './reports.service';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { PlanningPeriodEntity } from '../../database/entities/planning-period.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { ShiftEntity } from '../../database/entities/shift.entity';
import { TimeEntrySessionEntity } from '../../database/entities/time-entry-session.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { VacationEntity } from '../../database/entities/vacation.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import { ShiftsService } from '../shifts/shifts.service';

describe('ReportsService', () => {
  function createQueryBuilder(count: number) {
    return {
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(count)
    };
  }

  function createService() {
    const counts = {
      companies: 2,
      users: 8,
      employees: 8,
      workLocations: 6,
      shifts: 4,
      planningPeriods: 3,
      publishedPlanningPeriods: 2,
      timeEntries: 48,
      vacationsPending: 1,
      permissionsPending: 2,
      incidentsOpen: 1,
      activeSessions: 3,
      currentMonthPlannedMinutes: 1440,
      currentMonthWorkedMinutes: 1390,
      currentMonthCoverageRate: 96.5,
      currentMonthAbsenceDays: 2,
      currentMonthIncidentDays: 1,
      currentMonthUnplannedDays: 1,
      currentMonthPolicyWarnings: 0,
      currentMonthPolicyViolations: 0,
      currentMonthOvertimeMinutes: 0,
      currentMonthNightWorkMinutes: 0
    };

    const companyRepo = {
      count: jest.fn().mockResolvedValue(counts.companies),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.companies))
    };

    const usersRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.users))
    };
    const employeesRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.employees))
    };
    const workLocationsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.workLocations))
    };
    const shiftsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.shifts))
    };
    const planningPeriodsRepo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(createQueryBuilder(counts.planningPeriods))
        .mockReturnValueOnce(createQueryBuilder(counts.publishedPlanningPeriods))
    };
    const timeEntriesRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.timeEntries))
    };
    const sessionsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.activeSessions))
    };
    const vacationsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.vacationsPending))
    };
    const permissionsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.permissionsPending))
    };
    const incidentsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder(counts.incidentsOpen))
    };
    const shiftsService = {
      getSchedule: jest.fn().mockResolvedValue({
        rows: [
          {
            days: [
              { workingDay: true, expectedMinutes: 480, workedMinutes: 450, status: 'WORKING', incidentId: null, assignmentId: 1 },
              { workingDay: true, expectedMinutes: 480, workedMinutes: 480, status: 'VACATION', incidentId: null, assignmentId: 1 },
              { workingDay: false, expectedMinutes: 0, workedMinutes: 0, status: 'HOLIDAY', incidentId: 10, assignmentId: null },
              { workingDay: true, expectedMinutes: 480, workedMinutes: 460, status: 'PERMISSION', incidentId: null, assignmentId: null }
            ]
          }
        ]
      })
    } as unknown as ShiftsService;

    const tenantScope = {
      applyCompanyScope: jest.fn((qb) => qb)
    } as unknown as TenantScopeService;

    const service = new ReportsService(
      companyRepo as never,
      usersRepo as never,
      employeesRepo as never,
      workLocationsRepo as never,
      shiftsRepo as never,
      planningPeriodsRepo as never,
      timeEntriesRepo as never,
      sessionsRepo as never,
      vacationsRepo as never,
      permissionsRepo as never,
      incidentsRepo as never,
      shiftsService,
      tenantScope
    );

    return { service, counts };
  }

  it('returns aggregate counts for platform reporting', async () => {
    const { service, counts } = createService();

    const result = await service.summary({
      userId: 1,
      companyId: null,
      employeeId: null,
      roles: ['ROLE_SUPER_ADMIN'],
      canAccessAll: true
    });

    expect(result.companies).toBe(counts.companies);
    expect(result.planningPeriods).toBe(counts.planningPeriods);
    expect(result.publishedPlanningPeriods).toBe(counts.publishedPlanningPeriods);
    expect(result.timeEntries).toBe(counts.timeEntries);
    expect(result.activeSessions).toBe(counts.activeSessions);
    expect(result.currentMonthPlannedMinutes).toBe(counts.currentMonthPlannedMinutes);
    expect(result.currentMonthWorkedMinutes).toBe(counts.currentMonthWorkedMinutes);
    expect(result.currentMonthCoverageRate).toBe(counts.currentMonthCoverageRate);
    expect(result.currentMonthPolicyWarnings).toBe(counts.currentMonthPolicyWarnings);
    expect(result.currentMonthPolicyViolations).toBe(counts.currentMonthPolicyViolations);
  });
});
