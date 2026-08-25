import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalTenantContext, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { AuditLogDto, CreateAuditLogDto, UpdateAuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogsRepository: Repository<AuditLogEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly tenantScope: TenantScopeService
  ) {}

  async list(query: Partial<PaginationQueryDto> & { search?: string; companyId?: number; action?: string }, context: PrincipalTenantContext) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.auditLogsRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.company', 'company')
      .leftJoinAndSelect('auditLog.actorUser', 'actorUser');

    if (query.search) {
      qb.andWhere('(auditLog.entityName LIKE :search OR auditLog.entityId LIKE :search OR auditLog.action LIKE :search)', {
        search: `%${query.search}%`
      });
    }
    if (query.action) {
      qb.andWhere('auditLog.action = :action', { action: query.action });
    }
    if (query.companyId) {
      qb.andWhere('company.id = :companyId', { companyId: query.companyId });
    }

    this.tenantScope.applyCompanyScope(qb, 'auditLog', context);
    qb.orderBy('auditLog.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items.map((item) => this.toDto(item)), total, page, pageSize);
  }

  async get(id: string, context: PrincipalTenantContext) {
    const auditLog = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(auditLog.company?.id, context);
    return this.toDto(auditLog);
  }

  async create(dto: CreateAuditLogDto, context: PrincipalTenantContext) {
    const company = await this.resolveCompany(dto.companyId ?? context.companyId, context);
    const actorUser = dto.actorUserId ? await this.resolveUser(dto.actorUserId, context) : null;
    const auditLog = await this.auditLogsRepository.save(
      this.auditLogsRepository.create({
        company,
        actorUser,
        entityName: dto.entityName,
        entityId: dto.entityId,
        action: dto.action,
        beforeData: dto.beforeData ?? null,
        afterData: dto.afterData ?? null,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
        reason: dto.reason ?? null,
        metadata: dto.metadata ?? null
      })
    );
    return this.toDto(
      (await this.auditLogsRepository.findOne({
        where: { id: auditLog.id },
        relations: { company: true, actorUser: true }
      })) ?? auditLog
    );
  }

  async update(id: string, dto: UpdateAuditLogDto, context: PrincipalTenantContext) {
    const auditLog = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(auditLog.company?.id, context);
    const nextCompany = dto.companyId !== undefined ? await this.resolveCompany(dto.companyId, context) : auditLog.company ?? null;
    const nextActorUser =
      dto.actorUserId !== undefined ? (dto.actorUserId === null ? null : await this.resolveUser(dto.actorUserId, context)) : auditLog.actorUser ?? null;

    if (dto.companyId !== undefined && dto.companyId !== auditLog.company?.id) {
      auditLog.company = nextCompany ?? undefined;
    }
    if (dto.actorUserId !== undefined) auditLog.actorUser = nextActorUser ?? undefined;
    if (dto.entityName !== undefined) auditLog.entityName = dto.entityName;
    if (dto.entityId !== undefined) auditLog.entityId = dto.entityId;
    if (dto.action !== undefined) auditLog.action = dto.action;
    if (dto.beforeData !== undefined) auditLog.beforeData = dto.beforeData;
    if (dto.afterData !== undefined) auditLog.afterData = dto.afterData;
    if (dto.ipAddress !== undefined) auditLog.ipAddress = dto.ipAddress;
    if (dto.userAgent !== undefined) auditLog.userAgent = dto.userAgent;
    if (dto.reason !== undefined) auditLog.reason = dto.reason;
    if (dto.metadata !== undefined) auditLog.metadata = dto.metadata;

    const saved = await this.auditLogsRepository.save(auditLog);
    return this.toDto(
      (await this.auditLogsRepository.findOne({
        where: { id: saved.id },
        relations: { company: true, actorUser: true }
      })) ?? saved
    );
  }

  async delete(id: string, context: PrincipalTenantContext) {
    const auditLog = await this.findByIdOrFail(id);
    this.tenantScope.assertResourceAccess(auditLog.company?.id, context);
    await this.auditLogsRepository.remove(auditLog);
    return { message: 'Registro de auditoría eliminado' };
  }

  private async findByIdOrFail(id: string) {
    const auditLog = await this.auditLogsRepository.findOne({ where: { id }, relations: { company: true, actorUser: true } });
    if (!auditLog) throw new AppError('AUDIT_LOG_NOT_FOUND', 'Registro de auditoría no encontrado', 404);
    return auditLog;
  }

  private async resolveCompany(companyId: number | null | undefined, context: PrincipalTenantContext) {
    if (companyId === null || companyId === undefined) throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    const company = await this.companiesRepository.findOne({ where: { id: companyId } });
    if (!company) throw new AppError('COMPANY_NOT_FOUND', 'Empresa no encontrada', 404);
    this.tenantScope.assertResourceAccess(company.id, context);
    return company;
  }

  private async resolveUser(userId: number, context: PrincipalTenantContext) {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: { company: true } });
    if (!user) throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    this.tenantScope.assertResourceAccess(user.company?.id, context, user.id);
    return user;
  }

  private toDto(auditLog: AuditLogEntity): AuditLogDto {
    return {
      id: auditLog.id,
      companyId: auditLog.company?.id ?? null,
      companyName: auditLog.company?.name ?? null,
      actorUserId: auditLog.actorUser?.id ?? null,
      actorUserEmail: auditLog.actorUser?.email ?? null,
      entityName: auditLog.entityName,
      entityId: auditLog.entityId,
      action: auditLog.action,
      beforeData: auditLog.beforeData ?? null,
      afterData: auditLog.afterData ?? null,
      ipAddress: auditLog.ipAddress ?? null,
      userAgent: auditLog.userAgent ?? null,
      reason: auditLog.reason ?? null,
      metadata: auditLog.metadata ?? null,
      createdAt: auditLog.createdAt?.toISOString?.() ?? new Date().toISOString()
    };
  }
}
