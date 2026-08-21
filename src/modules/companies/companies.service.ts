import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TenantScopeService, PrincipalTenantContext } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async create(dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const exists = await this.companiesRepository.findOne({ where: [{ name: dto.name }, { code: dto.code }] });
    if (exists) {
      throw new AppError('COMPANY_ALREADY_EXISTS', 'Empresa ya existente', 409);
    }

    const company = await this.companiesRepository.save(
      this.companiesRepository.create({
        name: dto.name,
        code: dto.code,
        active: dto.active ?? true,
        timezone: dto.timezone ?? null,
        workPolicy: dto.workPolicy ?? null
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
    const saved = await this.companiesRepository.save(company);
    return this.toDto(saved);
  }

  toDto(company: CompanyEntity): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      code: company.code,
      timezone: company.timezone ?? null,
      workPolicy: company.workPolicy ?? null,
      active: company.active
    };
  }
}
