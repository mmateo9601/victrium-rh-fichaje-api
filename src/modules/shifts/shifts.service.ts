import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CalendarDayEntity } from '../../database/entities/calendar-day.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { ShiftAssignmentEntity } from '../../database/entities/shift-assignment.entity';
import { ShiftDayEntity } from '../../database/entities/shift-day.entity';
import { ShiftSegmentValue } from '../../database/entities/shift-day.entity';
import { ShiftRotationStepValue, ShiftEntity } from '../../database/entities/shift.entity';
import { ShiftOverrideEntity } from '../../database/entities/shift-override.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { VacationEntity } from '../../database/entities/vacation.entity';
import {
  CreateShiftAssignmentDto,
  CreateShiftDto,
  CreateShiftOverrideDto,
  EmployeeScheduleResponseDto,
  ScheduleResponseDto,
  ScheduleSummaryDto,
  ShiftAssignmentDto,
  ShiftDto,
  ShiftOverrideDto,
  UpdateShiftAssignmentDto,
  UpdateShiftDto,
  UpdateShiftOverrideDto
} from './dto/shift.dto';
import { WorkScheduleResolverService } from './work-schedule-resolver.service';

function normalizeDate(value: string) {
  return value.slice(0, 10);
}

function defaultRange() {
  const today = new Date();
  const from = new Date(today);
  from.setUTCDate(today.getUTCDate() - 6);
  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10)
  };
}

function rangeLength(from: string, to: string) {
  const start = new Date(`${from}T12:00:00.000Z`).getTime();
  const end = new Date(`${to}T12:00:00.000Z`).getTime();
  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
}

function assignmentOverlaps(leftFrom: string, leftTo: string | null | undefined, rightFrom: string, rightTo: string | null | undefined) {
  const leftEnd = leftTo ?? '9999-12-31';
  const rightEnd = rightTo ?? '9999-12-31';
  return leftFrom <= rightEnd && rightFrom <= leftEnd;
}

function normalizeSegment(segment: { startTime: string | null; endTime: string | null; breakMinutes: number; workingMinutes: number | null; crossesMidnight: boolean }): ShiftSegmentValue {
  return {
    startTime: segment.startTime,
    endTime: segment.endTime,
    breakMinutes: segment.breakMinutes,
    workingMinutes: segment.workingMinutes,
    crossesMidnight: segment.crossesMidnight
  };
}

function normalizeRotationStep(step: { working: boolean; startTime: string | null; endTime: string | null; breakMinutes: number; workingMinutes: number | null; crossesMidnight: boolean }): ShiftRotationStepValue {
  return {
    working: step.working,
    startTime: step.startTime,
    endTime: step.endTime,
    breakMinutes: step.breakMinutes,
    workingMinutes: step.workingMinutes,
    crossesMidnight: step.crossesMidnight
  };
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function buildScheduleSummary(
  from: string,
  to: string,
  employees: EmployeeEntity[],
  rows: ReturnType<WorkScheduleResolverService['buildEmployeeRows']>
): ScheduleSummaryDto {
  const cells = rows.flatMap((row) => row.days);
  const workingCells = cells.filter((cell) => cell.workingDay);
  const plannedMinutes = workingCells.reduce((total, cell) => total + cell.expectedMinutes, 0);
  const workedMinutes = workingCells.reduce((total, cell) => total + cell.workedMinutes, 0);
  const coverageRate = plannedMinutes > 0 ? Number(((workedMinutes / plannedMinutes) * 100).toFixed(1)) : 0;
  const plannedDays = workingCells.length;
  const workedDays = workingCells.filter((cell) => cell.workedMinutes > 0).length;
  const absenceDays = cells.filter((cell) => cell.status === 'VACATION' || cell.status === 'PERMISSION').length;
  const incidentDays = cells.filter((cell) => cell.incidentId !== null).length;
  const unplannedDays = workingCells.filter((cell) => cell.status === 'NO_SHIFT' || cell.assignmentId === null).length;

  const companyIds = new Set(employees.map((employee) => employee.company?.id).filter((companyId): companyId is number => typeof companyId === 'number'));
  const sharedPolicy = companyIds.size === 1 ? employees.find((employee) => employee.company?.workPolicy)?.company?.workPolicy ?? null : null;
  const weeklyTargetMinutes = toNumber(sharedPolicy?.['weeklyTargetMinutes']);
  const monthlyTargetMinutes = toNumber(sharedPolicy?.['monthlyTargetMinutes']);
  const days = rangeLength(from, to);
  const targetMinutes =
    days >= 28
      ? monthlyTargetMinutes ?? weeklyTargetMinutes
      : days <= 8
        ? weeklyTargetMinutes ?? monthlyTargetMinutes
        : monthlyTargetMinutes ?? weeklyTargetMinutes;
  const targetLabel =
    targetMinutes === null
      ? null
      : days >= 28 && monthlyTargetMinutes !== null
        ? 'monthly'
        : days <= 8 && weeklyTargetMinutes !== null
          ? 'weekly'
          : 'custom';

  return {
    rangeDays: days,
    plannedMinutes,
    workedMinutes,
    coverageRate,
    plannedDays,
    workedDays,
    absenceDays,
    incidentDays,
    unplannedDays,
    weeklyTargetMinutes,
    monthlyTargetMinutes,
    targetMinutes,
    targetLabel,
    remainingMinutes: targetMinutes !== null ? Math.max(0, targetMinutes - workedMinutes) : null,
    progressRate: targetMinutes !== null && targetMinutes > 0 ? Number(((workedMinutes / targetMinutes) * 100).toFixed(1)) : null
  };
}

@Injectable()
export class ShiftsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ShiftEntity)
    private readonly shiftsRepository: Repository<ShiftEntity>,
    @InjectRepository(ShiftAssignmentEntity)
    private readonly assignmentsRepository: Repository<ShiftAssignmentEntity>,
    @InjectRepository(ShiftOverrideEntity)
    private readonly overridesRepository: Repository<ShiftOverrideEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    @InjectRepository(VacationEntity)
    private readonly vacationsRepository: Repository<VacationEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionsRepository: Repository<PermissionEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidentsRepository: Repository<IncidentEntity>,
    @InjectRepository(TimeEntryEntity)
    private readonly timeEntriesRepository: Repository<TimeEntryEntity>,
    private readonly tenantScope: TenantScopeService,
    private readonly resolver: WorkScheduleResolverService
  ) {}

  async list(query: Partial<PaginationQueryDto> & { search?: string; active?: string } = {}, context: PrincipalTenantContext) {
    const qb = this.shiftsRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.company', 'company')
      .leftJoinAndSelect('shift.days', 'day')
      .leftJoinAndSelect('shift.assignments', 'assignment');

    if (query.search) {
      qb.andWhere('(shift.name LIKE :search OR shift.code LIKE :search OR shift.description LIKE :search)', { search: `%${query.search}%` });
    }

    if (query.active !== undefined) {
      const active = query.active === 'true' ? true : query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('shift.active = :active', { active });
      }
    }

    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    qb.orderBy('shift.active', 'DESC').addOrderBy('shift.name', 'ASC').distinct(true);
    const shifts = await qb.getMany();
    return shifts.map((shift) => this.toShiftDto(shift));
  }

  async findByIdOrFail(id: number, context: PrincipalTenantContext) {
    const shift = await this.shiftsRepository.findOne({
      where: { id },
      relations: { company: true, days: true, assignments: true, overrides: true }
    });

    if (!shift) {
      throw new AppError('SHIFT_NOT_FOUND', 'Turno no encontrado', 404);
    }

    this.tenantScope.assertResourceAccess(shift.company?.id, context);
    return shift;
  }

  async create(dto: CreateShiftDto, context: PrincipalTenantContext): Promise<ShiftDto> {
    const companyId = dto.companyId ?? context.companyId;
    if (companyId === null || companyId === undefined) {
      throw new AppError('SHIFT_CROSS_TENANT', 'No se pudo determinar la empresa del turno', 400);
    }

    return this.dataSource.transaction(async (manager) => {
      const company = await manager.getRepository(CompanyEntity).findOne({ where: { id: companyId } });
      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
      }
      this.tenantScope.assertResourceAccess(company.id, context);
      await this.assertUniqueShift(dto.name, dto.code, company.id, null, manager.getRepository(ShiftEntity));
      const shift = manager.getRepository(ShiftEntity).create({
        company,
        name: dto.name,
        code: dto.code,
        description: dto.description ?? null,
        color: dto.color ?? null,
        active: dto.active ?? true,
        rotationStartDate: dto.rotationStartDate ?? null,
        rotationPattern: dto.rotationPattern?.map((step) => normalizeRotationStep(step)) ?? null
      });
      const saved = await manager.getRepository(ShiftEntity).save(shift);
      const dayRepository = manager.getRepository(ShiftDayEntity);
      const days = this.buildShiftDays(dto.days, saved);
      if (days.length) {
        await dayRepository.save(days);
      }
      const reloaded = await manager.getRepository(ShiftEntity).findOne({
        where: { id: saved.id },
        relations: { company: true, days: true, assignments: true, overrides: true }
      });
      if (!reloaded) {
        throw new AppError('SHIFT_NOT_FOUND', 'Turno no encontrado', 404);
      }
      return this.toShiftDto(reloaded);
    });
  }

  async update(id: number, dto: UpdateShiftDto, context: PrincipalTenantContext): Promise<ShiftDto> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ShiftEntity);
      const shift = await repository.findOne({
        where: { id },
        relations: { company: true, days: true, assignments: true, overrides: true }
      });
      if (!shift) {
        throw new AppError('SHIFT_NOT_FOUND', 'Turno no encontrado', 404);
      }
      this.tenantScope.assertResourceAccess(shift.company?.id, context);

      if (dto.companyId !== undefined && dto.companyId !== shift.company.id) {
        const company = await manager.getRepository(CompanyEntity).findOne({ where: { id: dto.companyId } });
        if (!company) {
          throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
        }
        this.tenantScope.assertResourceAccess(company.id, context);
        shift.company = company;
      }

      if (dto.name !== undefined || dto.code !== undefined || dto.companyId !== undefined) {
        await this.assertUniqueShift(dto.name ?? shift.name, dto.code ?? shift.code, shift.company.id, shift.id, repository);
      }

      if (dto.name !== undefined) shift.name = dto.name;
      if (dto.code !== undefined) shift.code = dto.code;
      if (dto.description !== undefined) shift.description = dto.description;
      if (dto.color !== undefined) shift.color = dto.color;
      if (dto.active !== undefined) shift.active = dto.active;
      if (dto.rotationStartDate !== undefined) shift.rotationStartDate = dto.rotationStartDate;
      if (dto.rotationPattern !== undefined) {
        shift.rotationPattern = dto.rotationPattern?.map((step) => normalizeRotationStep(step)) ?? null;
      }
      if (dto.days) {
        const dayRepository = manager.getRepository(ShiftDayEntity);
        if (shift.days?.length) {
          await dayRepository.delete({ id: In(shift.days.map((day) => day.id)) });
        }
      }

      const saved = await repository.save(shift);
      if (dto.days) {
        const dayRepository = manager.getRepository(ShiftDayEntity);
        const nextDays = this.buildShiftDays(dto.days, saved);
        if (nextDays.length) {
          await dayRepository.save(nextDays);
        }
      }
      const reloaded = await repository.findOne({
        where: { id: saved.id },
        relations: { company: true, days: true, assignments: true, overrides: true }
      });
      if (!reloaded) {
        throw new AppError('SHIFT_NOT_FOUND', 'Turno no encontrado', 404);
      }
      return this.toShiftDto(reloaded);
    });
  }

  async activate(id: number, context: PrincipalTenantContext) {
    return this.setActive(id, true, context);
  }

  async deactivate(id: number, context: PrincipalTenantContext) {
    return this.setActive(id, false, context);
  }

  async setActive(id: number, active: boolean, context: PrincipalTenantContext): Promise<ShiftDto> {
    const shift = await this.findByIdOrFail(id, context);
    shift.active = active;
    const saved = await this.shiftsRepository.save(shift);
    return this.toShiftDto(saved);
  }

  async createAssignment(dto: CreateShiftAssignmentDto, context: PrincipalTenantContext): Promise<ShiftAssignmentDto> {
    return this.dataSource.transaction(async (manager) => {
      const employee = await manager.getRepository(EmployeeEntity).findOne({
        where: { id: dto.employeeId },
        relations: { company: true, user: true, calendar: true }
      });
      if (!employee) {
        throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
      }
      this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.id);

      const shift = await manager.getRepository(ShiftEntity).findOne({
        where: { id: dto.shiftId },
        relations: { company: true, days: true }
      });
      if (!shift) {
        throw new AppError('SHIFT_NOT_FOUND', 'Turno no encontrado', 404);
      }
      this.tenantScope.assertResourceAccess(shift.company?.id, context);

      if (!shift.active) {
        throw new AppError('SHIFT_INACTIVE', 'El turno está inactivo', 409);
      }

      if (employee.company?.id !== shift.company?.id) {
        throw new AppError('SHIFT_CROSS_TENANT', 'El turno pertenece a otra empresa', 404);
      }

      this.assertAssignmentOverlap(employee.id, dto.validFrom, dto.validTo ?? null, null);

      const assignment = manager.getRepository(ShiftAssignmentEntity).create({
        company: employee.company!,
        employee,
        shift,
        validFrom: normalizeDate(dto.validFrom),
        validTo: dto.validTo ? normalizeDate(dto.validTo) : null,
        notes: dto.notes ?? null,
        active: dto.active ?? true
      });
      const saved = await manager.getRepository(ShiftAssignmentEntity).save(assignment);
      const reloaded = await manager.getRepository(ShiftAssignmentEntity).findOne({
        where: { id: saved.id },
        relations: { company: true, employee: { company: true }, shift: { company: true, days: true } }
      });
      if (!reloaded) {
        throw new AppError('SHIFT_ASSIGNMENT_NOT_FOUND', 'Asignación no encontrada', 404);
      }
      return this.toAssignmentDto(reloaded);
    });
  }

  async updateAssignment(id: number, dto: UpdateShiftAssignmentDto, context: PrincipalTenantContext): Promise<ShiftAssignmentDto> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ShiftAssignmentEntity);
      const assignment = await repository.findOne({
        where: { id },
        relations: { company: true, employee: { company: true }, shift: { company: true, days: true } }
      });
      if (!assignment) {
        throw new AppError('SHIFT_ASSIGNMENT_NOT_FOUND', 'Asignación no encontrada', 404);
      }
      this.tenantScope.assertResourceAccess(assignment.company?.id, context, assignment.employee.id);

      const nextEmployeeId = dto.employeeId ?? assignment.employee.id;
      const nextShiftId = dto.shiftId ?? assignment.shift.id;
      const nextValidFrom = normalizeDate(dto.validFrom ?? assignment.validFrom);
      const nextValidTo = dto.validTo !== undefined ? (dto.validTo ? normalizeDate(dto.validTo) : null) : assignment.validTo ?? null;
      const nextActive = dto.active ?? assignment.active;

      const employee = await manager.getRepository(EmployeeEntity).findOne({ where: { id: nextEmployeeId }, relations: { company: true } });
      if (!employee) {
        throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
      }
      const shift = await manager.getRepository(ShiftEntity).findOne({ where: { id: nextShiftId }, relations: { company: true, days: true } });
      if (!shift) {
        throw new AppError('SHIFT_NOT_FOUND', 'Turno no encontrado', 404);
      }
      this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.id);
      this.tenantScope.assertResourceAccess(shift.company?.id, context);
      if (employee.company?.id !== shift.company?.id) {
        throw new AppError('SHIFT_CROSS_TENANT', 'El turno pertenece a otra empresa', 404);
      }

      this.assertAssignmentOverlap(employee.id, nextValidFrom, nextValidTo, assignment.id);

      assignment.employee = employee;
      assignment.shift = shift;
      assignment.company = employee.company!;
      assignment.validFrom = nextValidFrom;
      assignment.validTo = nextValidTo;
      assignment.notes = dto.notes !== undefined ? dto.notes : assignment.notes ?? null;
      assignment.active = nextActive;

      const saved = await repository.save(assignment);
      const reloaded = await repository.findOne({
        where: { id: saved.id },
        relations: { company: true, employee: { company: true }, shift: { company: true, days: true } }
      });
      if (!reloaded) {
        throw new AppError('SHIFT_ASSIGNMENT_NOT_FOUND', 'Asignación no encontrada', 404);
      }
      return this.toAssignmentDto(reloaded);
    });
  }

  async listAssignments(query: { employeeId?: number; shiftId?: number; active?: string } = {}, context: PrincipalTenantContext) {
    const qb = this.assignmentsRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.company', 'company')
      .leftJoinAndSelect('assignment.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany')
      .leftJoinAndSelect('assignment.shift', 'shift')
      .leftJoinAndSelect('shift.days', 'day');

    if (query.employeeId) {
      qb.andWhere('employee.id = :employeeId', { employeeId: query.employeeId });
    }
    if (query.shiftId) {
      qb.andWhere('shift.id = :shiftId', { shiftId: query.shiftId });
    }
    if (query.active !== undefined) {
      const active = query.active === 'true' ? true : query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('assignment.active = :active', { active });
      }
    }
    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }
    qb.orderBy('assignment.validFrom', 'DESC').addOrderBy('assignment.id', 'DESC').distinct(true);
    const assignments = await qb.getMany();
    return assignments.map((assignment) => this.toAssignmentDto(assignment));
  }

  async createOverride(dto: CreateShiftOverrideDto, context: PrincipalTenantContext): Promise<ShiftOverrideDto> {
    return this.dataSource.transaction(async (manager) => {
      const employee = await manager.getRepository(EmployeeEntity).findOne({ where: { id: dto.employeeId }, relations: { company: true } });
      if (!employee) {
        throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
      }
      this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.id);

      const shift =
        dto.shiftId !== undefined && dto.shiftId !== null
          ? await manager.getRepository(ShiftEntity).findOne({ where: { id: dto.shiftId }, relations: { company: true, days: true } })
          : null;
      if (dto.shiftId !== undefined && dto.shiftId !== null && !shift) {
        throw new AppError('SHIFT_NOT_FOUND', 'Turno no encontrado', 404);
      }
      if (shift) {
        this.tenantScope.assertResourceAccess(shift.company?.id, context);
        if (shift.company?.id !== employee.company?.id) {
          throw new AppError('SHIFT_CROSS_TENANT', 'El turno pertenece a otra empresa', 404);
        }
      }

      const existing = await manager.getRepository(ShiftOverrideEntity).findOne({
        where: { employee: { id: employee.id }, date: normalizeDate(dto.date) }
      });
      if (existing) {
        throw new AppError('SHIFT_OVERRIDE_CONFLICT', 'Ya existe una excepción para ese día', 409);
      }

      const override = manager.getRepository(ShiftOverrideEntity).create({
        company: employee.company!,
        employee,
        shift: shift ?? null,
        date: normalizeDate(dto.date),
        kind: dto.kind ?? (shift ? 'SHIFT' : 'OFF'),
        notes: dto.notes ?? null
      });
      const saved = await manager.getRepository(ShiftOverrideEntity).save(override);
      const reloaded = await manager.getRepository(ShiftOverrideEntity).findOne({
        where: { id: saved.id },
        relations: { company: true, employee: { company: true }, shift: { company: true, days: true } }
      });
      if (!reloaded) {
        throw new AppError('SHIFT_OVERRIDE_NOT_FOUND', 'Excepción no encontrada', 404);
      }
      return this.toOverrideDto(reloaded);
    });
  }

  async updateOverride(id: number, dto: UpdateShiftOverrideDto, context: PrincipalTenantContext): Promise<ShiftOverrideDto> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ShiftOverrideEntity);
      const override = await repository.findOne({
        where: { id },
        relations: { company: true, employee: { company: true }, shift: { company: true, days: true } }
      });
      if (!override) {
        throw new AppError('SHIFT_OVERRIDE_NOT_FOUND', 'Excepción no encontrada', 404);
      }
      this.tenantScope.assertResourceAccess(override.company?.id, context, override.employee.id);

      const nextEmployeeId = dto.employeeId ?? override.employee.id;
      const nextDate = normalizeDate(dto.date ?? override.date);
      const nextKind = dto.kind ?? override.kind;
      const nextShiftId = dto.shiftId !== undefined ? dto.shiftId : override.shift?.id ?? null;
      const employee = await manager.getRepository(EmployeeEntity).findOne({ where: { id: nextEmployeeId }, relations: { company: true } });
      if (!employee) {
        throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
      }
      this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.id);

      const shift =
        nextShiftId !== null
          ? await manager.getRepository(ShiftEntity).findOne({ where: { id: nextShiftId }, relations: { company: true, days: true } })
          : null;
      if (nextShiftId !== null && !shift) {
        throw new AppError('SHIFT_NOT_FOUND', 'Turno no encontrado', 404);
      }
      if (shift) {
        this.tenantScope.assertResourceAccess(shift.company?.id, context);
        if (employee.company?.id !== shift.company?.id) {
          throw new AppError('SHIFT_CROSS_TENANT', 'El turno pertenece a otra empresa', 404);
        }
      }

      const existing = await manager.getRepository(ShiftOverrideEntity).findOne({
        where: { employee: { id: employee.id }, date: nextDate }
      });
      if (existing && existing.id !== override.id) {
        throw new AppError('SHIFT_OVERRIDE_CONFLICT', 'Ya existe una excepción para ese día', 409);
      }

      override.employee = employee;
      override.company = employee.company!;
      override.date = nextDate;
      override.kind = nextKind;
      override.shift = shift ?? null;
      override.notes = dto.notes !== undefined ? dto.notes : override.notes ?? null;

      const saved = await repository.save(override);
      const reloaded = await repository.findOne({
        where: { id: saved.id },
        relations: { company: true, employee: { company: true }, shift: { company: true, days: true } }
      });
      if (!reloaded) {
        throw new AppError('SHIFT_OVERRIDE_NOT_FOUND', 'Excepción no encontrada', 404);
      }
      return this.toOverrideDto(reloaded);
    });
  }

  async listOverrides(query: { employeeId?: number; date?: string } = {}, context: PrincipalTenantContext) {
    const qb = this.overridesRepository
      .createQueryBuilder('override')
      .leftJoinAndSelect('override.company', 'company')
      .leftJoinAndSelect('override.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany')
      .leftJoinAndSelect('override.shift', 'shift')
      .leftJoinAndSelect('shift.days', 'day');
    if (query.employeeId) {
      qb.andWhere('employee.id = :employeeId', { employeeId: query.employeeId });
    }
    if (query.date) {
      qb.andWhere('override.date = :date', { date: normalizeDate(query.date) });
    }
    if (!context.canAccessAll) {
      if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }
    qb.orderBy('override.date', 'DESC').addOrderBy('override.id', 'DESC');
    const overrides = await qb.getMany();
    return overrides.map((override) => this.toOverrideDto(override));
  }

  async getSchedule(query: { from?: string; to?: string; employeeId?: number; shiftId?: number }, context: PrincipalTenantContext): Promise<ScheduleResponseDto> {
    const range = this.resolveRange(query.from, query.to);
    const employees = await this.listEmployeesForSchedule(query.employeeId, query.shiftId, context);
    const employeeIds = employees.map((employee) => employee.id);
    const userIds = employees.map((employee) => employee.user?.id).filter((id): id is number => typeof id === 'number');
    const days = this.resolver.buildRange(range.from, range.to);

    const [assignments, overrides, vacations, permissions, incidents, timeEntries] = await Promise.all([
      employeeIds.length
        ? this.assignmentsRepository.find({
            where: { employee: { id: In(employeeIds) }, active: true },
            relations: { company: true, employee: { company: true, user: true, calendar: { days: true } }, shift: { company: true, days: true } },
            order: { validFrom: 'ASC', id: 'ASC' }
          })
        : Promise.resolve([]),
      employeeIds.length
        ? this.overridesRepository.find({
            where: { employee: { id: In(employeeIds) } },
            relations: { company: true, employee: { company: true, user: true, calendar: { days: true } }, shift: { company: true, days: true } },
            order: { date: 'ASC', id: 'ASC' }
          })
        : Promise.resolve([]),
      employeeIds.length
        ? this.vacationsRepository.find({
            where: { employee: { id: In(employeeIds) }, inicio: Between(range.from, range.to) },
            relations: { company: true, employee: { company: true } },
            order: { inicio: 'ASC', id: 'ASC' }
          })
        : Promise.resolve([]),
      employeeIds.length
        ? this.permissionsRepository.find({
            where: { employee: { id: In(employeeIds) }, dia: Between(range.from, range.to) },
            relations: { company: true, employee: { company: true } },
            order: { dia: 'ASC', id: 'ASC' }
          })
        : Promise.resolve([]),
      employeeIds.length
        ? this.incidentsRepository.find({
            where: { employee: { id: In(employeeIds) }, dia: Between(range.from, range.to) },
            relations: { company: true, employee: { company: true } },
            order: { dia: 'ASC', id: 'ASC' }
          })
        : Promise.resolve([]),
      userIds.length
        ? this.timeEntriesRepository.find({
            where: { usuario: { id: In(userIds) }, dia: Between(range.from, range.to) },
            relations: { usuario: { company: true } },
            order: { dia: 'ASC', hora: 'ASC', id: 'ASC' }
          })
        : Promise.resolve([])
    ]);

    const assignmentsByEmployee = this.groupByEmployee(assignments);
    const overridesByEmployee = this.groupByEmployee(overrides);
    const vacationsByEmployee = this.groupByEmployee(vacations);
    const permissionsByEmployee = this.groupByEmployee(permissions);
    const incidentsByEmployee = this.groupByEmployee(incidents);
    const timeEntriesByEmployee = this.groupByEmployeeTimeEntries(timeEntries);
    const calendarDaysByEmployee = this.groupCalendarDays(employees);
    const rows = this.resolver.buildEmployeeRows(
      employees,
      days,
      assignmentsByEmployee,
      overridesByEmployee,
      vacationsByEmployee,
      permissionsByEmployee,
      incidentsByEmployee,
      timeEntriesByEmployee,
      calendarDaysByEmployee
    );

    return {
      from: range.from,
      to: range.to,
      employees: employees.map((employee) => ({
        employeeId: employee.id,
        employeeNumero: employee.numero,
        employeeNombre: employee.nombreEmpleado,
        companyId: employee.company?.id ?? null,
        companyName: employee.company?.name ?? null
      })),
      days,
      summary: buildScheduleSummary(range.from, range.to, employees, rows),
      rows
    };
  }

  async getMySchedule(context: PrincipalTenantContext, query: { from?: string; to?: string; shiftId?: number } = {}): Promise<EmployeeScheduleResponseDto> {
    if (!context.employeeId) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }
    return this.getSchedule({ ...query, employeeId: context.employeeId }, context);
  }

  async getEmployeeSchedule(employeeId: number, context: PrincipalTenantContext, query: { from?: string; to?: string; shiftId?: number } = {}) {
    return this.getSchedule({ ...query, employeeId }, context);
  }

  async getEmployeeAssignments(employeeId: number, context: PrincipalTenantContext) {
    const employee = await this.employeesRepository.findOne({ where: { id: employeeId }, relations: { company: true } });
    if (!employee) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }
    this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.id);
    return this.listAssignments({ employeeId }, context);
  }

  async getEmployeeShift(employeeId: number, context: PrincipalTenantContext) {
    const schedule = await this.getEmployeeSchedule(employeeId, context, {});
    return {
      employeeId,
      days: schedule.rows[0]?.days ?? []
    };
  }

  async getShiftSummaryForEmployee(employeeId: number, date: string, context: PrincipalTenantContext) {
    const schedule = await this.getEmployeeSchedule(employeeId, context, { from: date, to: date });
    return schedule.rows[0]?.days[0] ?? null;
  }

  private resolveRange(from?: string, to?: string) {
    if (!from || !to) {
      return defaultRange();
    }
    return { from: normalizeDate(from), to: normalizeDate(to) };
  }

  private async listEmployeesForSchedule(employeeId: number | undefined, shiftId: number | undefined, context: PrincipalTenantContext) {
    const qb = this.employeesRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.company', 'company')
      .leftJoinAndSelect('employee.calendar', 'calendar')
      .leftJoinAndSelect('calendar.days', 'calendarDay')
      .leftJoinAndSelect('employee.user', 'user');

    if (employeeId) {
      qb.andWhere('employee.id = :employeeId', { employeeId });
    } else if (!context.canAccessAll) {
      if (context.employeeId && context.roles.includes('ROLE_USER')) {
        qb.andWhere('employee.id = :employeeId', { employeeId: context.employeeId });
      } else if (context.companyId !== null && context.companyId !== undefined) {
        qb.andWhere('company.id = :companyId', { companyId: context.companyId });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    if (shiftId) {
      qb.leftJoin('employee.shiftAssignments', 'assignmentFilter');
      qb.andWhere('(assignmentFilter.shift_id = :shiftId OR assignmentFilter.id IS NULL)', { shiftId });
    }

    qb.orderBy('employee.nombreEmpleado', 'ASC').distinct(true);
    return qb.getMany();
  }

  private buildShiftDays(
    days: Array<{
      dayOfWeek: number;
      working: boolean;
      startTime: string | null;
      endTime: string | null;
      breakMinutes: number;
      workingMinutes: number | null;
      crossesMidnight: boolean;
      segments?: ShiftSegmentValue[] | Array<{ startTime: string | null; endTime: string | null; breakMinutes: number; workingMinutes: number | null; crossesMidnight: boolean }>;
    }>,
    existing: ShiftEntity
  ) {
    return days.map((day) => {
      const entity = new ShiftDayEntity();
      entity.dayOfWeek = day.dayOfWeek;
      entity.working = day.working;
      entity.startTime = day.startTime;
      entity.endTime = day.endTime;
      entity.breakMinutes = day.breakMinutes;
      entity.workingMinutes = day.workingMinutes;
      entity.crossesMidnight = day.crossesMidnight;
      entity.segments = day.segments?.map((segment) => normalizeSegment(segment)) ?? null;
      entity.shift = existing;
      return entity;
    });
  }

  private async assertUniqueShift(name: string, code: string, companyId: number, currentId: number | null, repository: Repository<ShiftEntity>) {
    const existing = await repository.findOne({ where: [{ name, company: { id: companyId } }, { code, company: { id: companyId } }] });
    if (existing && existing.id !== currentId) {
      throw new AppError('SHIFT_ALREADY_EXISTS', 'Ya existe un turno con ese nombre o código', 409);
    }
  }

  private assertAssignmentOverlap(employeeId: number, validFrom: string, validTo: string | null, currentId: number | null) {
    const normalizedFrom = normalizeDate(validFrom);
    const normalizedTo = validTo ? normalizeDate(validTo) : null;
    return this.assignmentsRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.employee', 'employee')
      .where('employee.id = :employeeId', { employeeId })
      .andWhere(currentId ? 'assignment.id <> :currentId' : '1 = 1', { currentId })
      .getMany()
      .then((assignments) => {
        const conflicting = assignments.find((assignment) => assignment.active && assignmentOverlaps(assignment.validFrom, assignment.validTo, normalizedFrom, normalizedTo));
        if (conflicting) {
          throw new AppError('SHIFT_ASSIGNMENT_OVERLAP', 'El empleado ya tiene una asignación que se solapa en esas fechas', 409);
        }
      });
  }

  private groupByEmployee<T extends { employee: EmployeeEntity }>(items: T[]) {
    const map = new Map<number, T[]>();
    for (const item of items) {
      const list = map.get(item.employee.id) ?? [];
      list.push(item);
      map.set(item.employee.id, list);
    }
    return map;
  }

  private groupByEmployeeTimeEntries(items: TimeEntryEntity[]) {
    const map = new Map<number, TimeEntryEntity[]>();
    for (const item of items) {
      const userId = item.usuario?.id;
      if (!userId) continue;
      const list = map.get(userId) ?? [];
      list.push(item);
      map.set(userId, list);
    }
    return map;
  }

  private groupCalendarDays(employees: EmployeeEntity[]) {
    const map = new Map<number, Map<string, CalendarDayEntity>>();
    for (const employee of employees) {
      const employeeMap = new Map<string, CalendarDayEntity>();
      for (const day of employee.calendar?.days ?? []) {
        employeeMap.set(day.dia, day);
      }
      map.set(employee.id, employeeMap);
    }
    return map;
  }

  private toShiftDto(shift: ShiftEntity): ShiftDto {
    return {
      id: shift.id,
      name: shift.name,
      code: shift.code,
      description: shift.description ?? null,
      color: shift.color ?? null,
      active: shift.active,
      rotationStartDate: shift.rotationStartDate ?? null,
      rotationPattern: (shift.rotationPattern ?? []).map((step, index) => ({
        id: index + 1,
        working: step.working,
        startTime: step.startTime ?? null,
        endTime: step.endTime ?? null,
        breakMinutes: step.breakMinutes,
        workingMinutes: step.workingMinutes ?? null,
        crossesMidnight: step.crossesMidnight
      })),
      companyId: shift.company?.id ?? null,
      companyName: shift.company?.name ?? null,
      days: (shift.days ?? []).map((day) => ({
        id: day.id,
        dayOfWeek: day.dayOfWeek,
        working: day.working,
        startTime: day.startTime ?? null,
        endTime: day.endTime ?? null,
        breakMinutes: day.breakMinutes,
        workingMinutes: day.workingMinutes ?? null,
        crossesMidnight: day.crossesMidnight,
        segments: (day.segments ?? []).map((segment, index) => ({
          id: index + 1,
          startTime: segment.startTime ?? null,
          endTime: segment.endTime ?? null,
          breakMinutes: segment.breakMinutes,
          workingMinutes: segment.workingMinutes ?? null,
          crossesMidnight: segment.crossesMidnight
        }))
      })),
      assignmentsCount: shift.assignments?.length ?? 0,
      createdAt: shift.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: shift.updatedAt?.toISOString?.() ?? new Date().toISOString()
    };
  }

  private toAssignmentDto(assignment: ShiftAssignmentEntity): ShiftAssignmentDto {
    return {
      id: assignment.id,
      companyId: assignment.company?.id ?? null,
      companyName: assignment.company?.name ?? null,
      employeeId: assignment.employee.id,
      employeeNumero: assignment.employee.numero,
      employeeNombre: assignment.employee.nombreEmpleado,
      shift: {
        id: assignment.shift.id,
        name: assignment.shift.name,
        code: assignment.shift.code,
        color: assignment.shift.color ?? null
      },
      validFrom: assignment.validFrom,
      validTo: assignment.validTo ?? null,
      notes: assignment.notes ?? null,
      active: assignment.active,
      createdAt: assignment.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: assignment.updatedAt?.toISOString?.() ?? new Date().toISOString()
    };
  }

  private toOverrideDto(override: ShiftOverrideEntity): ShiftOverrideDto {
    return {
      id: override.id,
      companyId: override.company?.id ?? null,
      companyName: override.company?.name ?? null,
      employeeId: override.employee.id,
      employeeNumero: override.employee.numero,
      employeeNombre: override.employee.nombreEmpleado,
      shift: override.shift
        ? {
            id: override.shift.id,
            name: override.shift.name,
            code: override.shift.code,
            color: override.shift.color ?? null
          }
        : null,
      date: override.date,
      kind: override.kind,
      notes: override.notes ?? null,
      createdAt: override.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: override.updatedAt?.toISOString?.() ?? new Date().toISOString()
    };
  }
}
