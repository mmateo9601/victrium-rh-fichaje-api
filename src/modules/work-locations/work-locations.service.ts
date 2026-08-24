import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CalendarEntity } from '../../database/entities/calendar.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { EmployeeLocationAssignmentEntity } from '../../database/entities/employee-location-assignment.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import {
  CreateEmployeeLocationAssignmentDto,
  CreateWorkLocationDto,
  EmployeeLocationAssignmentDto,
  UpdateEmployeeLocationAssignmentDto,
  UpdateWorkLocationDto,
  WorkLocationDto
} from './dto/work-location.dto';

type WorkLocationListQuery = Partial<PaginationQueryDto> & {
  search?: string;
  active?: string;
  companyId?: number;
};

type AssignmentListQuery = Partial<PaginationQueryDto> & {
  employeeId?: number;
  workLocationId?: number;
};

function normalizeDate(value: string) {
  return value.slice(0, 10);
}

function assignmentOverlaps(leftFrom: string, leftTo: string | null | undefined, rightFrom: string, rightTo: string | null | undefined) {
  const leftEnd = leftTo ?? '9999-12-31';
  const rightEnd = rightTo ?? '9999-12-31';
  return leftFrom <= rightEnd && rightFrom <= leftEnd;
}

@Injectable()
export class WorkLocationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(WorkLocationEntity)
    private readonly workLocationsRepository: Repository<WorkLocationEntity>,
    @InjectRepository(EmployeeLocationAssignmentEntity)
    private readonly assignmentsRepository: Repository<EmployeeLocationAssignmentEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(CalendarEntity)
    private readonly calendarsRepository: Repository<CalendarEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async list(query: WorkLocationListQuery, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.workLocationsRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.company', 'company')
      .leftJoinAndSelect('location.calendar', 'calendar');

    if (query.search) {
      qb.andWhere('(location.name LIKE :search OR location.code LIKE :search OR location.city LIKE :search OR location.province LIKE :search)', {
        search: `%${query.search}%`
      });
    }

    if (query.active !== undefined) {
      const active = query.active === 'true' ? true : query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('location.active = :active', { active });
      }
    }

    if (query.companyId) {
      qb.andWhere('company.id = :companyId', { companyId: query.companyId });
    }

    this.tenantScope.applyCompanyScope(qb, 'location', context);

    const allowedSortFields = new Set(['id', 'name', 'code', 'active', 'city', 'province']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`location.${sortField}`, (query.order ?? 'asc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [locations, total] = await qb.getManyAndCount();
    return buildPaginatedResult(locations.map((location) => this.toDto(location)), total, page, pageSize);
  }

  async findByIdOrFail(id: number, context: PrincipalTenantContext) {
    const location = await this.workLocationsRepository.findOne({
      where: { id },
      relations: { company: true, calendar: true }
    });
    if (!location) {
      throw new AppError('WORK_LOCATION_NOT_FOUND', 'Centro de trabajo no encontrado', 404);
    }
    this.tenantScope.assertResourceAccess(location.company?.id, context);
    return location;
  }

  async create(dto: CreateWorkLocationDto, context: PrincipalTenantContext): Promise<WorkLocationDto> {
    const companyId = dto.companyId ?? context.companyId;
    if (companyId === null || companyId === undefined) {
      throw new AppError('COMPANY_NOT_FOUND', 'No se pudo determinar la empresa del centro', 400);
    }

    const company = await this.companiesRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    }
    this.tenantScope.assertResourceAccess(company.id, context);

    const existing = await this.workLocationsRepository.findOne({
      where: [{ company: { id: company.id }, code: dto.code }, { company: { id: company.id }, name: dto.name }]
    });
    if (existing) {
      throw new AppError('WORK_LOCATION_ALREADY_EXISTS', 'Ya existe un centro con ese nombre o código', 409);
    }

    const calendar = dto.timezone
      ? await this.calendarsRepository.findOne({ where: { company: { id: company.id }, active: true } })
      : null;

    const location = await this.workLocationsRepository.save(
      this.workLocationsRepository.create({
        company,
        name: dto.name,
        code: dto.code,
        address: dto.address ?? null,
        city: dto.city ?? null,
        province: dto.province ?? null,
        postalCode: dto.postalCode ?? null,
        timezone: dto.timezone ?? company.timezone ?? null,
        active: true,
        calendar
      })
    );

    return this.toDto(location);
  }

  async update(id: number, dto: UpdateWorkLocationDto, context: PrincipalTenantContext) {
    const location = await this.findByIdOrFail(id, context);
    const nextCompanyId = dto.companyId ?? location.company?.id ?? null;

    if (nextCompanyId === null || nextCompanyId === undefined) {
      throw new AppError('COMPANY_NOT_FOUND', 'No se pudo determinar la empresa del centro', 400);
    }

    if (!context.canAccessAll && dto.companyId !== undefined && dto.companyId !== context.companyId) {
      throw new AppError('FORBIDDEN_CROSS_TENANT', 'No puedes mover el centro a otra empresa', 403);
    }

    const nextCompany = await this.companiesRepository.findOne({ where: { id: nextCompanyId } });
    if (!nextCompany) {
      throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    }
    this.tenantScope.assertResourceAccess(nextCompany.id, context);

    if (dto.name !== undefined || dto.code !== undefined) {
      const duplicate = await this.workLocationsRepository.findOne({
        where: [
          { company: { id: nextCompany.id }, name: dto.name ?? location.name },
          { company: { id: nextCompany.id }, code: dto.code ?? location.code }
        ]
      });
      if (duplicate && duplicate.id !== location.id) {
        throw new AppError('WORK_LOCATION_ALREADY_EXISTS', 'Ya existe un centro con ese nombre o código', 409);
      }
    }

    location.company = nextCompany;
    if (dto.name !== undefined) location.name = dto.name;
    if (dto.code !== undefined) location.code = dto.code;
    if (dto.address !== undefined) location.address = dto.address;
    if (dto.city !== undefined) location.city = dto.city;
    if (dto.province !== undefined) location.province = dto.province;
    if (dto.postalCode !== undefined) location.postalCode = dto.postalCode;
    if (dto.timezone !== undefined) location.timezone = dto.timezone;
    if (dto.active !== undefined) location.active = dto.active;

    const saved = await this.workLocationsRepository.save(location);
    return this.toDto(saved);
  }

  async activate(id: number, context: PrincipalTenantContext) {
    return this.update(id, { active: true }, context);
  }

  async deactivate(id: number, context: PrincipalTenantContext) {
    return this.update(id, { active: false }, context);
  }

  async delete(id: number, context: PrincipalTenantContext) {
    const location = await this.findByIdOrFail(id, context);

    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM employee_location_assignments WHERE work_location_id = ?', [location.id]);
      await manager.query('DELETE FROM turno_asignaciones WHERE work_location_id = ?', [location.id]);
      await manager.query('DELETE FROM turno_overrides WHERE work_location_id = ?', [location.id]);
      await manager.getRepository(WorkLocationEntity).remove(location);
    });

    return { message: 'Centro eliminado' };
  }

  async listAssignments(query: AssignmentListQuery, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.assignmentsRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.company', 'company')
      .leftJoinAndSelect('assignment.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany')
      .leftJoinAndSelect('assignment.workLocation', 'workLocation')
      .leftJoinAndSelect('workLocation.company', 'workLocationCompany');

    if (query.employeeId) {
      qb.andWhere('employee.id = :employeeId', { employeeId: query.employeeId });
    }
    if (query.workLocationId) {
      qb.andWhere('workLocation.id = :workLocationId', { workLocationId: query.workLocationId });
    }

    this.tenantScope.applyCompanyScope(qb, 'assignment', context);

    qb.orderBy('assignment.validFrom', 'DESC').addOrderBy('assignment.id', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [assignments, total] = await qb.getManyAndCount();
    return buildPaginatedResult(assignments.map((assignment) => this.toAssignmentDto(assignment)), total, page, pageSize);
  }

  async createAssignment(dto: CreateEmployeeLocationAssignmentDto, context: PrincipalTenantContext): Promise<EmployeeLocationAssignmentDto> {
    return this.saveAssignment(dto, context, null);
  }

  async updateAssignment(id: number, dto: UpdateEmployeeLocationAssignmentDto, context: PrincipalTenantContext): Promise<EmployeeLocationAssignmentDto> {
    const current = await this.assignmentsRepository.findOne({
      where: { id },
      relations: { company: true, employee: { company: true }, workLocation: { company: true } }
    });
    if (!current) {
      throw new AppError('LOCATION_ASSIGNMENT_NOT_FOUND', 'Asignación de centro no encontrada', 404);
    }
    this.tenantScope.assertResourceAccess(current.company?.id, context, current.employee.id);

    return this.saveAssignment(
      {
        employeeId: dto.employeeId ?? current.employee.id,
        workLocationId: dto.workLocationId ?? current.workLocation.id,
        validFrom: dto.validFrom ?? current.validFrom,
        validTo: dto.validTo ?? current.validTo,
        primary: dto.primary ?? current.primary,
        notes: dto.notes ?? current.notes
      },
      context,
      current.id
    );
  }

  async assignmentsForEmployee(employeeId: number, context: PrincipalTenantContext) {
    const employee = await this.employeesRepository.findOne({ where: { id: employeeId }, relations: { company: true } });
    if (!employee) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }
    this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.id);
    return this.listAssignments({ employeeId }, context);
  }

  private async saveAssignment(
    dto: CreateEmployeeLocationAssignmentDto,
    context: PrincipalTenantContext,
    currentId: number | null
  ): Promise<EmployeeLocationAssignmentDto> {
    const employee = await this.employeesRepository.findOne({ where: { id: dto.employeeId }, relations: { company: true } });
    if (!employee) {
      throw new AppError('EMPLOYEE_NOT_FOUND', 'Empleado no encontrado', 404);
    }
    this.tenantScope.assertResourceAccess(employee.company?.id, context, employee.id);

    const workLocation = await this.workLocationsRepository.findOne({
      where: { id: dto.workLocationId },
      relations: { company: true }
    });
    if (!workLocation) {
      throw new AppError('WORK_LOCATION_NOT_FOUND', 'Centro de trabajo no encontrado', 404);
    }
    this.tenantScope.assertResourceAccess(workLocation.company?.id, context);

    if (employee.company?.id !== workLocation.company?.id) {
      throw new AppError('WORK_LOCATION_CROSS_TENANT', 'El centro pertenece a otra empresa', 404);
    }

    const validFrom = normalizeDate(dto.validFrom);
    const validTo = dto.validTo ? normalizeDate(dto.validTo) : null;

    const overlaps = await this.assignmentsRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.employee', 'employee')
      .where('employee.id = :employeeId', { employeeId: employee.id })
      .andWhere(currentId ? 'assignment.id <> :currentId' : '1 = 1', { currentId })
      .getMany();

    const conflict = overlaps.find((assignment) => assignmentOverlaps(assignment.validFrom, assignment.validTo, validFrom, validTo));
    if (conflict) {
      throw new AppError('LOCATION_ASSIGNMENT_OVERLAP', 'El empleado ya tiene una asignación de centro que se solapa en esas fechas', 409);
    }

    const assignment = this.assignmentsRepository.create({
      company: employee.company!,
      employee,
      workLocation,
      validFrom,
      validTo,
      primary: dto.primary ?? false,
      notes: dto.notes ?? null
    });
    const saved = await this.assignmentsRepository.save(assignment);
    const reloaded = await this.assignmentsRepository.findOne({
      where: { id: saved.id },
      relations: { company: true, employee: { company: true }, workLocation: { company: true } }
    });
    if (!reloaded) {
      throw new AppError('LOCATION_ASSIGNMENT_NOT_FOUND', 'Asignación de centro no encontrada', 404);
    }
    return this.toAssignmentDto(reloaded);
  }

  private toDto(location: WorkLocationEntity): WorkLocationDto {
    return {
      id: location.id,
      companyId: location.company?.id ?? null,
      companyName: location.company?.name ?? null,
      name: location.name,
      code: location.code,
      address: location.address ?? null,
      city: location.city ?? null,
      province: location.province ?? null,
      postalCode: location.postalCode ?? null,
      timezone: location.timezone ?? null,
      active: location.active,
      calendarId: location.calendar?.id ?? null,
      calendarName: location.calendar?.nombre ?? null,
      createdAt: location.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: location.updatedAt?.toISOString?.() ?? new Date().toISOString()
    };
  }

  private toAssignmentDto(assignment: EmployeeLocationAssignmentEntity): EmployeeLocationAssignmentDto {
    return {
      id: assignment.id,
      companyId: assignment.company?.id ?? null,
      companyName: assignment.company?.name ?? null,
      employeeId: assignment.employee.id,
      employeeNumero: assignment.employee.numero,
      employeeNombre: assignment.employee.nombreEmpleado,
      workLocationId: assignment.workLocation.id,
      workLocationName: assignment.workLocation.name,
      workLocationCode: assignment.workLocation.code,
      validFrom: assignment.validFrom,
      validTo: assignment.validTo ?? null,
      primary: assignment.primary,
      notes: assignment.notes ?? null,
      createdAt: assignment.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: assignment.updatedAt?.toISOString?.() ?? new Date().toISOString()
    };
  }
}
