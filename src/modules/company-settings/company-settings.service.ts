import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { CompanySettingEntity } from '../../database/entities/company-setting.entity';
import { CreateCompanySettingDto, CompanySettingDto, UpdateCompanySettingDto } from './dto/company-setting.dto';

@Injectable()
export class CompanySettingsService {
  constructor(
    @InjectRepository(CompanySettingEntity)
    private readonly settingsRepository: Repository<CompanySettingEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async list(query: Partial<PaginationQueryDto> & { search?: string; active?: string; companyId?: number }, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.settingsRepository.createQueryBuilder('setting').leftJoinAndSelect('setting.company', 'company');

    if (query.search) {
      qb.andWhere('(setting.settingKey LIKE :search OR setting.dataType LIKE :search)', { search: `%${query.search}%` });
    }
    if (query.active !== undefined) {
      const active = query.active === 'true' ? true : query.active === 'false' ? false : null;
      if (active !== null) qb.andWhere('setting.active = :active', { active });
    }
    if (query.companyId) {
      qb.andWhere('company.id = :companyId', { companyId: query.companyId });
    }

    this.tenantScope.applyCompanyScope(qb, 'setting', context);
    qb.orderBy('setting.settingKey', 'ASC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items.map((item) => this.toDto(item)), total, page, pageSize);
  }

  async get(id: number, context: PrincipalTenantContext) {
    const setting = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(setting.company?.id, context);
    return this.toDto(setting);
  }

  async create(dto: CreateCompanySettingDto, context: PrincipalTenantContext) {
    const company = await this.resolveCompany(dto.companyId ?? context.companyId, context);
    await this.ensureUnique(company.id, dto.settingKey);
    const setting = await this.settingsRepository.save(
      this.settingsRepository.create({
        company,
        settingKey: dto.settingKey,
        settingValue: dto.settingValue,
        dataType: dto.dataType ?? null,
        active: dto.active ?? true,
        notes: dto.notes ?? null,
        metadata: dto.metadata ?? null
      })
    );
    return this.toDto(
      (await this.settingsRepository.findOne({ where: { id: setting.id }, relations: { company: true } })) ?? setting
    );
  }

  async update(id: number, dto: UpdateCompanySettingDto, context: PrincipalTenantContext) {
    const setting = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(setting.company?.id, context);

    const nextCompany = dto.companyId !== undefined ? await this.resolveCompany(dto.companyId, context) : setting.company;
    if (dto.settingKey !== undefined || nextCompany.id !== setting.company?.id) {
      await this.ensureUnique(nextCompany.id, dto.settingKey ?? setting.settingKey, setting.id);
    }

    setting.company = nextCompany;
    if (dto.settingKey !== undefined) setting.settingKey = dto.settingKey;
    if (dto.settingValue !== undefined) setting.settingValue = dto.settingValue;
    if (dto.dataType !== undefined) setting.dataType = dto.dataType;
    if (dto.active !== undefined) setting.active = dto.active;
    if (dto.notes !== undefined) setting.notes = dto.notes;
    if (dto.metadata !== undefined) setting.metadata = dto.metadata;

    const saved = await this.settingsRepository.save(setting);
    return this.toDto((await this.settingsRepository.findOne({ where: { id: saved.id }, relations: { company: true } })) ?? saved);
  }

  async activate(id: number, context: PrincipalTenantContext) {
    return this.update(id, { active: true }, context);
  }

  async deactivate(id: number, context: PrincipalTenantContext) {
    return this.update(id, { active: false }, context);
  }

  async delete(id: number, context: PrincipalTenantContext) {
    const setting = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(setting.company?.id, context);
    await this.settingsRepository.remove(setting);
    return { message: 'Configuración eliminada' };
  }

  private async findByIdOrFail(id: number) {
    const setting = await this.settingsRepository.findOne({ where: { id }, relations: { company: true } });
    if (!setting) throw new AppError('COMPANY_SETTING_NOT_FOUND', 'Configuración no encontrada', 404);
    return setting;
  }

  private async resolveCompany(companyId: number | null | undefined, context: PrincipalTenantContext) {
    if (companyId === null || companyId === undefined) throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    const company = await this.companiesRepository.findOne({ where: { id: companyId } });
    if (!company) throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    this.tenantScope.assertResourceAccess(company.id, context);
    return company;
  }

  private async ensureUnique(companyId: number, settingKey: string, excludeId?: number) {
    const qb = this.settingsRepository
      .createQueryBuilder('setting')
      .leftJoin('setting.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('setting.settingKey = :settingKey', { settingKey });
    if (excludeId !== undefined) qb.andWhere('setting.id <> :excludeId', { excludeId });
    const existing = await qb.getOne();
    if (existing) throw new AppError('COMPANY_SETTING_ALREADY_EXISTS', 'Ya existe una configuración con esa clave', 409);
  }

  private toDto(setting: CompanySettingEntity): CompanySettingDto {
    return {
      id: setting.id,
      companyId: setting.company?.id ?? null,
      companyName: setting.company?.name ?? null,
      settingKey: setting.settingKey,
      settingValue: setting.settingValue,
      dataType: setting.dataType ?? null,
      active: setting.active,
      notes: setting.notes ?? null,
      metadata: setting.metadata ?? null,
      createdAt: setting.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: setting.updatedAt?.toISOString?.() ?? new Date().toISOString()
    };
  }
}
