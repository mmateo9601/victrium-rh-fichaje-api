import { randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { AppError } from '../../common/errors/app-error';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PrincipalLike, TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { ApiKeyEntity } from '../../database/entities/api-key.entity';
import { UsersService } from '../users/users.service';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

type ApiKeysListQuery = PaginationQueryDto & {
  search?: string;
  active?: string | boolean;
  sort?: string;
  order?: string;
};

export type ApiKeyPrincipal = {
  sub: number;
  numero: string;
  nombreEmpleado: string;
  roles: string[];
  companyId: number | null;
  employeeId: number | null;
  apiKeyId?: number;
  apiKeyName?: string;
  authMethod: 'jwt' | 'api-key';
};

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeysRepository: Repository<ApiKeyEntity>,
    private readonly usersService: UsersService,
    private readonly tenantScope: TenantScopeService
  ) {}

  async create(dto: CreateApiKeyDto, principal: PrincipalLike): Promise<ApiKeyResponseDto> {
    const context = this.tenantScope.toContext(principal);
    const user = await this.usersService.findByIdOrFail(dto.userId);
    await this.usersService.requireTenantAccess(user, context);

    const activeKeysCount = await this.apiKeysRepository.count({
      where: {
        user: { id: user.id },
        active: true
      }
    });

    if (activeKeysCount >= 10) {
      throw new AppError('API_KEY_LIMIT_REACHED', 'Límite de API Keys activas alcanzado', 400);
    }

    const plainApiKey = randomBytes(32).toString('base64url');
    const keyHash = await bcrypt.hash(plainApiKey, 10);

    const entity = this.apiKeysRepository.create({
      keyHash,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      user,
      company: user.company ?? user.employee?.company ?? null,
      active: true,
      expiresAt: dto.expiresInDays ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000) : null,
      createdBy: principal.numero ?? String(principal.sub ?? 'system')
    });

    const saved = await this.apiKeysRepository.save(entity);
    return this.toResponse(saved, plainApiKey);
  }

  async list(query: ApiKeysListQuery, principal: PrincipalLike) {
    const context = this.tenantScope.toContext(principal);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.apiKeysRepository
      .createQueryBuilder('apiKey')
      .leftJoinAndSelect('apiKey.user', 'user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.company', 'userCompany')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany')
      .leftJoinAndSelect('apiKey.company', 'company');

    if (query.search) {
      qb.andWhere(
        '(apiKey.name LIKE :search OR apiKey.description LIKE :search OR user.email LIKE :search OR user.numero LIKE :search OR user.nombreEmpleado LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.active !== undefined) {
      const active =
        query.active === true || query.active === 'true' ? true : query.active === false || query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('apiKey.active = :active', { active });
      }
    }

    this.tenantScope.applyCompanyScope(qb, 'apiKey', context);
    qb.distinct(true);

    const allowedSortFields = new Set(['id', 'name', 'active', 'createdAt', 'updatedAt', 'expiresAt', 'lastUsedAt']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`apiKey.${sortField}`, (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [apiKeys, total] = await qb.getManyAndCount();
    return buildPaginatedResult(apiKeys.map((apiKey) => this.toResponse(apiKey)), total, page, pageSize);
  }

  async listByUser(userId: number, query: ApiKeysListQuery, principal: PrincipalLike) {
    const context = this.tenantScope.toContext(principal);
    const user = await this.usersService.findByIdOrFail(userId);
    await this.usersService.requireTenantAccess(user, context);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const qb = this.apiKeysRepository
      .createQueryBuilder('apiKey')
      .leftJoinAndSelect('apiKey.user', 'user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.company', 'userCompany')
      .leftJoinAndSelect('user.employee', 'employee')
      .leftJoinAndSelect('employee.company', 'employeeCompany')
      .leftJoinAndSelect('apiKey.company', 'company')
      .where('user.id = :userId', { userId });

    if (query.search) {
      qb.andWhere(
        '(apiKey.name LIKE :search OR apiKey.description LIKE :search OR user.email LIKE :search OR user.numero LIKE :search OR user.nombreEmpleado LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.active !== undefined) {
      const active =
        query.active === true || query.active === 'true' ? true : query.active === false || query.active === 'false' ? false : null;
      if (active !== null) {
        qb.andWhere('apiKey.active = :active', { active });
      }
    }

    this.tenantScope.applyCompanyScope(qb, 'apiKey', context);
    qb.distinct(true);

    const allowedSortFields = new Set(['id', 'name', 'active', 'createdAt', 'updatedAt', 'expiresAt', 'lastUsedAt']);
    const sortField = allowedSortFields.has(query.sort ?? '') ? query.sort ?? 'id' : 'id';
    qb.orderBy(`apiKey.${sortField}`, (query.order ?? 'desc').toUpperCase() as 'ASC' | 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [apiKeys, total] = await qb.getManyAndCount();
    return buildPaginatedResult(apiKeys.map((apiKey) => this.toResponse(apiKey)), total, page, pageSize);
  }

  async findByIdOrFail(id: number, principal: PrincipalLike) {
    const apiKey = await this.apiKeysRepository.findOne({
      where: { id },
      relations: {
        user: {
          roles: true,
          company: true,
          employee: {
            company: true
          }
        },
        company: true
      }
    });

    if (!apiKey) {
      throw new AppError('API_KEY_NOT_FOUND', 'API Key no encontrada', 404);
    }

    this.tenantScope.assertResourceAccess(apiKey.company?.id ?? apiKey.user.company?.id ?? apiKey.user.employee?.company?.id, this.tenantScope.toContext(principal), apiKey.user.id);
    return apiKey;
  }

  async getById(id: number, principal: PrincipalLike) {
    const apiKey = await this.findByIdOrFail(id, principal);
    return this.toResponse(apiKey);
  }

  async deactivate(id: number, principal: PrincipalLike) {
    const apiKey = await this.findByIdOrFail(id, principal);
    apiKey.active = false;
    await this.apiKeysRepository.save(apiKey);
    return this.toResponse(apiKey);
  }

  async activate(id: number, principal: PrincipalLike) {
    const apiKey = await this.findByIdOrFail(id, principal);
    apiKey.active = true;
    await this.apiKeysRepository.save(apiKey);
    return this.toResponse(apiKey);
  }

  async remove(id: number, principal: PrincipalLike) {
    const apiKey = await this.findByIdOrFail(id, principal);
    await this.apiKeysRepository.remove(apiKey);
  }

  async authenticate(plainApiKey: string): Promise<ApiKeyPrincipal | null> {
    if (!plainApiKey || plainApiKey.length < 32) {
      return null;
    }

    const apiKeys = await this.apiKeysRepository.find({
      where: { active: true },
      relations: {
        user: {
          roles: true,
          company: true,
          employee: {
            company: true
          }
        },
        company: true
      }
    });

    for (const apiKey of apiKeys) {
      if (!(await bcrypt.compare(plainApiKey, apiKey.keyHash))) {
        continue;
      }

      if (!apiKey.isValid()) {
        return null;
      }

      apiKey.updateLastUsed();
      await this.apiKeysRepository.save(apiKey);
      return this.toPrincipal(apiKey);
    }

    return null;
  }

  private toPrincipal(apiKey: ApiKeyEntity): ApiKeyPrincipal {
    return {
      sub: apiKey.user.id,
      numero: apiKey.user.numero,
      nombreEmpleado: apiKey.user.nombreEmpleado,
      roles: (apiKey.user.roles ?? []).map((role) => role.rolNombre),
      companyId: apiKey.company?.id ?? apiKey.user.company?.id ?? apiKey.user.employee?.company?.id ?? null,
      employeeId: apiKey.user.employee?.id ?? null,
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      authMethod: 'api-key'
    };
  }

  toResponse(apiKey: ApiKeyEntity, plainApiKey?: string): ApiKeyResponseDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      description: apiKey.description ?? null,
      userId: apiKey.user.id,
      userNumero: apiKey.user.numero,
      userNombreEmpleado: apiKey.user.nombreEmpleado,
      companyId: apiKey.company?.id ?? apiKey.user.company?.id ?? apiKey.user.employee?.company?.id ?? null,
      active: apiKey.active,
      expiresAt: apiKey.expiresAt ?? null,
      lastUsedAt: apiKey.lastUsedAt ?? null,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      createdBy: apiKey.createdBy ?? null,
      plainApiKey
    };
  }
}
