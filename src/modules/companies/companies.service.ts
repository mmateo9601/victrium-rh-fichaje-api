import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TenantScopeService, PrincipalTenantContext } from '../../common/tenant/tenant-scope.service';
import { CalendarEntity } from '../../database/entities/calendar.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { PlanningPeriodEntity } from '../../database/entities/planning-period.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(CalendarEntity)
    private readonly calendarsRepository: Repository<CalendarEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(WorkLocationEntity)
    private readonly workLocationsRepository: Repository<WorkLocationEntity>,
    @InjectRepository(PlanningPeriodEntity)
    private readonly planningPeriodsRepository: Repository<PlanningPeriodEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async create(dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const exists = await this.companiesRepository.findOne({ where: [{ name: dto.name }, { code: dto.code }] });
    if (exists) {
      throw new AppError('COMPANY_ALREADY_EXISTS', 'Empresa ya existente', 409);
    }

    const defaultCalendar =
      dto.defaultCalendarId === undefined || dto.defaultCalendarId === null
        ? null
        : await this.resolveCompanyCalendar(dto.defaultCalendarId, null);

    const company = await this.companiesRepository.save(
      this.companiesRepository.create({
        name: dto.name,
        code: dto.code,
        active: dto.active ?? true,
        timezone: dto.timezone ?? null,
        workPolicy: dto.workPolicy ?? null,
        defaultCalendar
      })
    );

    return this.toDto(company);
  }

  async list(query: PaginationQueryDto & { search?: string; active?: string }, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.companiesRepository.createQueryBuilder('company');

    if (query.search) {
      qb.andWhere('(company.name LIKE :search OR company.code LIKE :search)', {
        search: `%${query.search}%`
      });
    }

    if (query.active !== undefined) {
      const active = query.active === 'true' ? true : query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('company.active = :active', { active });
      }
    }

    if (!context.canAccessAll && context.companyId !== null) {
      qb.andWhere('company.id = :companyId', { companyId: context.companyId });
    } else if (!context.canAccessAll) {
      qb.andWhere('1 = 0');
    }

    const allowedSortFields = new Set(['id', 'name', 'code', 'active']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`company.${sortField}`, (query.order ?? 'asc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [companies, total] = await qb.getManyAndCount();
    return buildPaginatedResult(companies.map((company) => this.toDto(company)), total, page, pageSize);
  }

  async findByIdOrFail(id: number) {
    const company = await this.companiesRepository.findOne({ where: { id } });
    if (!company) {
      throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    }
    return company;
  }

  async getVisibleCompany(id: number, context: PrincipalTenantContext) {
    const company = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(company.id, context);
    return this.toDto(company);
  }

  async findMine(context: PrincipalTenantContext) {
    if (context.companyId === null || context.companyId === undefined) {
      throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    }

    return this.getVisibleCompany(context.companyId, context);
  }

  async update(id: number, dto: UpdateCompanyDto, context: PrincipalTenantContext) {
    const company = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(company.id, context);
    if (dto.name !== undefined) {
      company.name = dto.name;
    }
    if (dto.code !== undefined) {
      company.code = dto.code;
    }
    if (dto.active !== undefined) {
      company.active = dto.active;
    }
    if (dto.timezone !== undefined) {
      company.timezone = dto.timezone;
    }
    if (dto.workPolicy !== undefined) {
      company.workPolicy = dto.workPolicy;
    }
    if (dto.defaultCalendarId !== undefined) {
      company.defaultCalendar =
        dto.defaultCalendarId === null ? null : await this.resolveCompanyCalendar(dto.defaultCalendarId, company.id);
    }
    const saved = await this.companiesRepository.save(company);
    return this.toDto(saved);
  }

  async delete(id: number, context: PrincipalTenantContext) {
    const company = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(company.id, context);

    const [employeesCount, usersCount, workLocationsCount, calendarsCount, planningPeriodsCount] = await Promise.all([
      this.employeesRepository.count({ where: { company: { id: company.id } } }),
      this.usersRepository.count({ where: { company: { id: company.id } } }),
      this.workLocationsRepository.count({ where: { company: { id: company.id } } }),
      this.calendarsRepository.count({ where: { company: { id: company.id } } }),
      this.planningPeriodsRepository.count({ where: { company: { id: company.id } } })
    ]);

    if (employeesCount || usersCount || workLocationsCount || calendarsCount || planningPeriodsCount) {
      throw new AppError(
        'COMPANY_HAS_DEPENDENCIES',
        'No se puede eliminar la empresa porque todavía tiene usuarios, empleados, centros, calendarios o periodos de planificación asociados',
        409
      );
    }

    await this.companiesRepository.remove(company);
    return { message: 'Empresa eliminada' };
  }

  private async resolveCompanyCalendar(calendarId: number, companyId: number | null) {
    const calendar = await this.calendarsRepository.findOne({
      where: { id: calendarId },
      relations: {
        company: true
      }
    });

    if (!calendar) {
      throw new AppError('CALENDAR_NOT_FOUND', 'Calendario no encontrado', 404);
    }

    if (companyId !== null && calendar.company?.id !== companyId) {
      throw new AppError('CALENDAR_COMPANY_MISMATCH', 'El calendario no pertenece a la empresa', 400);
    }

    return calendar;
  }

  toDto(company: CompanyEntity): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      code: company.code,
      timezone: company.timezone ?? null,
      defaultCalendarId: company.defaultCalendar?.id ?? null,
      workPolicy: company.workPolicy ?? null,
      active: company.active
    };
  }
}
