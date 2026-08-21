import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';

import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { PlanningPeriodEntity } from '../../database/entities/planning-period.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { ShiftEntity } from '../../database/entities/shift.entity';
import { TimeEntrySessionEntity } from '../../database/entities/time-entry-session.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { VacationEntity } from '../../database/entities/vacation.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { ShiftsService } from '../shifts/shifts.service';
import { ReportsSummaryDto } from './dto/reports.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    @InjectRepository(WorkLocationEntity)
    private readonly workLocationsRepository: Repository<WorkLocationEntity>,
    @InjectRepository(ShiftEntity)
    private readonly shiftsRepository: Repository<ShiftEntity>,
    @InjectRepository(PlanningPeriodEntity)
    private readonly planningPeriodsRepository: Repository<PlanningPeriodEntity>,
    @InjectRepository(TimeEntryEntity)
    private readonly timeEntriesRepository: Repository<TimeEntryEntity>,
    @InjectRepository(TimeEntrySessionEntity)
    private readonly sessionsRepository: Repository<TimeEntrySessionEntity>,
    @InjectRepository(VacationEntity)
    private readonly vacationsRepository: Repository<VacationEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionsRepository: Repository<PermissionEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidentsRepository: Repository<IncidentEntity>,
    private readonly shiftsService: ShiftsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  async summary(context: PrincipalTenantContext): Promise<ReportsSummaryDto> {
    const companies = context.canAccessAll ? await this.companiesRepository.count() : context.companyId ? 1 : 0;
    const employees = await this.count(this.employeesRepository, 'employee', context);
    const workLocations = await this.count(this.workLocationsRepository, 'workLocation', context);
    const shifts = await this.count(this.shiftsRepository, 'shift', context);
    const planningPeriods = await this.count(this.planningPeriodsRepository, 'period', context);
    const publishedPlanningPeriods = await this.count(this.planningPeriodsRepository, 'period', context, (qb) =>
      qb.andWhere('period.status = :status', { status: 'PUBLISHED' })
    );
    const timeEntries = await this.countTimeEntries(context);
    const vacationsPending = await this.count(this.vacationsRepository, 'vacation', context, (qb) =>
      qb.andWhere('vacation.estado = :status', { status: 'PENDIENTE' })
    );
    const permissionsPending = await this.count(this.permissionsRepository, 'permission', context, (qb) =>
      qb.andWhere('permission.estado = :status', { status: 'PENDIENTE' })
    );
    const incidentsOpen = await this.count(this.incidentsRepository, 'incident', context, (qb) => qb.andWhere('incident.resuelta = :resolved', { resolved: false }));
    const activeSessions = await this.countActiveSessions(context);
    const operational = await this.buildOperationalMetrics(context);

    return {
      companies,
      users: await this.count(this.usersRepository, 'user', context),
      employees,
      workLocations,
      shifts,
      planningPeriods,
      publishedPlanningPeriods,
      timeEntries,
      vacationsPending,
      permissionsPending,
      incidentsOpen,
      activeSessions,
      ...operational
    };
  }

  private async buildOperationalMetrics(context: PrincipalTenantContext) {
    const { from, to } = this.currentMonthRange();
    const schedule = await this.shiftsService.getSchedule({ from, to }, context);
    const cells = schedule.rows.flatMap((row) => row.days);
    const workingCells = cells.filter((cell) => cell.workingDay);
    const policyCells = workingCells.filter((cell) => cell.policy !== null);

    const currentMonthPlannedMinutes = workingCells.reduce((total, cell) => total + cell.expectedMinutes, 0);
    const currentMonthWorkedMinutes = workingCells.reduce((total, cell) => total + cell.workedMinutes, 0);
    const currentMonthCoverageRate = currentMonthPlannedMinutes > 0 ? Number(((currentMonthWorkedMinutes / currentMonthPlannedMinutes) * 100).toFixed(1)) : 0;
    const currentMonthAbsenceDays = cells.filter((cell) => cell.status === 'VACATION' || cell.status === 'PERMISSION').length;
    const currentMonthIncidentDays = cells.filter((cell) => cell.incidentId !== null).length;
    const currentMonthUnplannedDays = workingCells.filter((cell) => cell.status === 'NO_SHIFT' || cell.assignmentId === null).length;
    const currentMonthPolicyWarnings = policyCells.reduce((total, cell) => total + (cell.policy?.warnings.length ?? 0), 0);
    const currentMonthPolicyViolations = policyCells.reduce((total, cell) => total + (cell.policy?.violations.length ?? 0), 0);
    const currentMonthOvertimeMinutes = policyCells.reduce((total, cell) => total + (cell.policy?.overtimeMinutes ?? 0), 0);
    const currentMonthNightWorkMinutes = policyCells.reduce((total, cell) => total + (cell.policy?.nightWorkMinutes ?? 0), 0);

    return {
      currentMonthFrom: from,
      currentMonthTo: to,
      currentMonthPlannedMinutes,
      currentMonthWorkedMinutes,
      currentMonthCoverageRate,
      currentMonthAbsenceDays,
      currentMonthIncidentDays,
      currentMonthUnplannedDays,
      currentMonthPolicyWarnings,
      currentMonthPolicyViolations,
      currentMonthOvertimeMinutes,
      currentMonthNightWorkMinutes
    };
  }

  private currentMonthRange() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const from = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    const to = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
    return { from, to };
  }

  private async count<T extends ObjectLiteral>(
    repository: Repository<T>,
    alias: string,
    context: PrincipalTenantContext,
    decorate?: (qb: ReturnType<Repository<T>['createQueryBuilder']>) => void
  ) {
    const qb = repository.createQueryBuilder(alias);
    this.tenantScope.applyCompanyScope(qb, alias, context);
    decorate?.(qb);
    return qb.getCount();
  }

  private async countTimeEntries(context: PrincipalTenantContext) {
    const qb = this.timeEntriesRepository
      .createQueryBuilder('timeEntry')
      .leftJoin('timeEntry.usuario', 'user')
      .leftJoin('user.company', 'company');

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    return qb.getCount();
  }

  private async countActiveSessions(context: PrincipalTenantContext) {
    const qb = this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoin('session.usuario', 'user')
      .leftJoin('user.company', 'company')
      .where('session.state != :state', { state: 'COMPLETED' });

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    return qb.getCount();
  }

}
