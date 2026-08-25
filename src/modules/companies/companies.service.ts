import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TenantScopeService, PrincipalTenantContext } from '../../common/tenant/tenant-scope.service';
import { ApiKeyEntity } from '../../database/entities/api-key.entity';
import { AuthSessionEntity } from '../../database/entities/auth-session.entity';
import { CalendarEntity } from '../../database/entities/calendar.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { CompanySettingEntity } from '../../database/entities/company-setting.entity';
import { DepartmentEntity } from '../../database/entities/department.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UserEntity } from '../../database/entities/user.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import { TeamEntity } from '../../database/entities/team.entity';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(CalendarEntity)
    private readonly calendarsRepository: Repository<CalendarEntity>,
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

  async setActive(id: number, active: boolean, context: PrincipalTenantContext) {
    const company = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(company.id, context);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(CompanyEntity).update({ id: company.id }, { active });
      await manager.getRepository(WorkLocationEntity).createQueryBuilder().update().set({ active }).where('company_id = :companyId', { companyId: company.id }).execute();
      await manager
        .getRepository(EmployeeEntity)
        .createQueryBuilder()
        .update()
        .set({ deBaja: !active, working: active })
        .where('company_id = :companyId', { companyId: company.id })
        .execute();
      await manager.getRepository(CalendarEntity).createQueryBuilder().update().set({ active }).where('company_id = :companyId', { companyId: company.id }).execute();
      await manager.getRepository(UserEntity).createQueryBuilder().update().set({ deBaja: !active }).where('company_id = :companyId', { companyId: company.id }).execute();
      await manager.getRepository(ApiKeyEntity).createQueryBuilder().update().set({ active }).where('company_id = :companyId', { companyId: company.id }).execute();
      await manager.getRepository(DepartmentEntity).createQueryBuilder().update().set({ active }).where('company_id = :companyId', { companyId: company.id }).execute();
      await manager.getRepository(TeamEntity).createQueryBuilder().update().set({ active }).where('company_id = :companyId', { companyId: company.id }).execute();
      await manager.getRepository(CompanySettingEntity).createQueryBuilder().update().set({ active }).where('company_id = :companyId', { companyId: company.id }).execute();
      await manager
        .getRepository(AuthSessionEntity)
        .createQueryBuilder()
        .update()
        .set({ revokedAt: active ? null : new Date() })
        .where('user_id IN (SELECT id FROM usuarios WHERE company_id = :companyId)', { companyId: company.id })
        .execute();
    });

    return { message: active ? 'Empresa activada' : 'Empresa desactivada' };
  }

  async delete(id: number, context: PrincipalTenantContext) {
    const company = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(company.id, context);

    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM fichaje_audits WHERE corrected_by_id IN (SELECT id FROM usuarios WHERE company_id = ?)', [company.id]);
      await manager.query('DELETE FROM time_entry_sessions WHERE usuario_id IN (SELECT id FROM usuarios WHERE company_id = ?)', [company.id]);
      await manager.query('DELETE FROM fichajes WHERE usuario_id IN (SELECT id FROM usuarios WHERE company_id = ?)', [company.id]);
      await manager.query('DELETE FROM auth_sessions WHERE user_id IN (SELECT id FROM usuarios WHERE company_id = ?)', [company.id]);
      await manager.query('DELETE FROM api_keys WHERE user_id IN (SELECT id FROM usuarios WHERE company_id = ?)', [company.id]);

      await manager.query('DELETE FROM employee_location_assignments WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM turno_asignaciones WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM turno_overrides WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM vacaciones WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM permisos WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM incidencias WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM employment_terms WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM planning_periods WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM turnos WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM work_locations WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM calendarios WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM company_settings WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM teams WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM departments WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM audit_logs WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM usuarios WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM employees WHERE company_id = ?', [company.id]);
      await manager.query('DELETE FROM companies WHERE id = ?', [company.id]);
    });

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
