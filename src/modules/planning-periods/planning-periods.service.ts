import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { PlanningPeriodEntity } from '../../database/entities/planning-period.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { CreatePlanningPeriodDto, PlanningPeriodDto, UpdatePlanningPeriodDto } from './dto/planning-period.dto';

type PlanningPeriodListQuery = Partial<PaginationQueryDto> & {
  search?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  companyId?: number;
};

function normalizeDate(value: string) {
  return value.slice(0, 10);
}

function isValidRange(startDate: string, endDate: string) {
  return startDate <= endDate;
}

@Injectable()
export class PlanningPeriodsService {
  constructor(
    @InjectRepository(PlanningPeriodEntity)
    private readonly planningPeriodsRepository: Repository<PlanningPeriodEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async list(query: PlanningPeriodListQuery, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.planningPeriodsRepository
      .createQueryBuilder('period')
      .leftJoinAndSelect('period.company', 'company')
      .leftJoinAndSelect('period.publishedBy', 'publishedBy');

    if (query.search) {
      qb.andWhere('(period.name LIKE :search OR company.name LIKE :search OR company.code LIKE :search)', {
        search: `%${query.search}%`
      });
    }

    if (query.status) {
      qb.andWhere('period.status = :status', { status: query.status });
    }

    if (query.companyId) {
      qb.andWhere('company.id = :companyId', { companyId: query.companyId });
    }

    this.tenantScope.applyCompanyScope(qb, 'period', context);

    const allowedSortFields = new Set(['id', 'name', 'startDate', 'endDate', 'status', 'version', 'publishedAt']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`period.${sortField}`, (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [periods, total] = await qb.getManyAndCount();
    return buildPaginatedResult(periods.map((period) => this.toDto(period)), total, page, pageSize);
  }

  async findByIdOrFail(id: number, context: PrincipalTenantContext) {
    const period = await this.planningPeriodsRepository.findOne({
      where: { id },
      relations: { company: true, publishedBy: true }
    });

    if (!period) {
      throw new AppError('PLANNING_PERIOD_NOT_FOUND', 'Periodo de planificación no encontrado', 404);
    }

    this.tenantScope.assertResourceAccess(period.company?.id, context);
    return period;
  }

  async create(dto: CreatePlanningPeriodDto, context: PrincipalTenantContext): Promise<PlanningPeriodDto> {
    const companyId = dto.companyId ?? context.companyId;
    if (companyId === null || companyId === undefined) {
      throw new AppError('COMPANY_NOT_FOUND', 'No se pudo determinar la empresa del periodo', 400);
    }

    const company = await this.companiesRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    }
    this.tenantScope.assertResourceAccess(company.id, context);

    const startDate = normalizeDate(dto.startDate);
    const endDate = normalizeDate(dto.endDate);
    this.assertValidRange(startDate, endDate);

    await this.assertUniquePeriod(dto.name, company.id, null);

    const period = await this.planningPeriodsRepository.save(
      this.planningPeriodsRepository.create({
        company,
        name: dto.name,
        startDate,
        endDate,
        status: 'DRAFT',
        version: 1,
        notes: dto.notes ?? null,
        publishedAt: null,
        publishedBy: null
      })
    );

    return this.toDto(period);
  }

  async update(id: number, dto: UpdatePlanningPeriodDto, context: PrincipalTenantContext) {
    const period = await this.findByIdOrFail(id, context);

    if (period.status === 'PUBLISHED' && (dto.name !== undefined || dto.startDate !== undefined || dto.endDate !== undefined || dto.companyId !== undefined)) {
      throw new AppError('PLANNING_PERIOD_LOCKED', 'El periodo publicado debe volver a borrarse antes de editar sus fechas o nombre', 409);
    }

    if (dto.companyId !== undefined && dto.companyId !== period.company.id) {
      const company = await this.companiesRepository.findOne({ where: { id: dto.companyId } });
      if (!company) {
        throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
      }
      this.tenantScope.assertResourceAccess(company.id, context);
      period.company = company;
    }

    if (dto.name !== undefined) {
      await this.assertUniquePeriod(dto.name, period.company.id, period.id);
      period.name = dto.name;
    }

    if (dto.startDate !== undefined) {
      period.startDate = normalizeDate(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      period.endDate = normalizeDate(dto.endDate);
    }

    if (dto.startDate !== undefined || dto.endDate !== undefined) {
      this.assertValidRange(period.startDate, period.endDate);
    }

    if (dto.notes !== undefined) {
      period.notes = dto.notes;
    }

    const saved = await this.planningPeriodsRepository.save(period);
    return this.toDto(saved);
  }

  async publish(id: number, context: PrincipalTenantContext): Promise<PlanningPeriodDto> {
    const period = await this.findByIdOrFail(id, context);
    if (period.status === 'PUBLISHED') {
      return this.toDto(period);
    }

    period.status = 'PUBLISHED';
    period.publishedAt = new Date();
    period.version += 1;
    period.publishedBy = await this.resolveCurrentUser(context);

    const saved = await this.planningPeriodsRepository.save(period);
    return this.toDto(saved);
  }

  async unpublish(id: number, context: PrincipalTenantContext): Promise<PlanningPeriodDto> {
    const period = await this.findByIdOrFail(id, context);
    if (period.status === 'DRAFT') {
      return this.toDto(period);
    }

    period.status = 'DRAFT';
    period.version += 1;

    const saved = await this.planningPeriodsRepository.save(period);
    return this.toDto(saved);
  }

  private async resolveCurrentUser(context: PrincipalTenantContext) {
    if (!context.userId) {
      return null;
    }

    return this.usersRepository.findOne({ where: { id: context.userId } });
  }

  private async assertUniquePeriod(name: string, companyId: number, currentId: number | null) {
    const existing = await this.planningPeriodsRepository.findOne({
      where: [{ company: { id: companyId }, name }]
    });
    if (existing && existing.id !== currentId) {
      throw new AppError('PLANNING_PERIOD_ALREADY_EXISTS', 'Ya existe un periodo con ese nombre en la empresa', 409);
    }
  }

  private assertValidRange(startDate: string, endDate: string) {
    if (!isValidRange(startDate, endDate)) {
      throw new AppError('PLANNING_PERIOD_INVALID_RANGE', 'La fecha de inicio debe ser anterior o igual a la de fin', 400);
    }
  }

  private toDto(period: PlanningPeriodEntity): PlanningPeriodDto {
    return {
      id: period.id,
      companyId: period.company?.id ?? null,
      companyName: period.company?.name ?? null,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      version: period.version,
      publishedAt: period.publishedAt?.toISOString?.() ?? null,
      publishedById: period.publishedBy?.id ?? null,
      publishedByNumero: period.publishedBy?.numero ?? null,
      publishedByNombre: period.publishedBy?.nombreEmpleado ?? null,
      notes: period.notes ?? null,
      createdAt: period.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: period.updatedAt?.toISOString?.() ?? new Date().toISOString()
    };
  }
}
