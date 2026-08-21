import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

import { AppError } from '../errors/app-error';

export type PrincipalTenantContext = {
  userId: number;
  companyId: number | null;
  employeeId: number | null;
  roles: string[];
  canAccessAll: boolean;
};

export type PrincipalLike = {
  sub?: number;
  numero?: string;
  nombreEmpleado?: string;
  companyId?: number | null;
  employeeId?: number | null;
  roles?: string[];
};

@Injectable()
export class TenantScopeService {
  toContext(principal: PrincipalLike): PrincipalTenantContext {
    const roles = principal.roles ?? [];
    return {
      userId: principal.sub ?? 0,
      companyId: principal.companyId ?? null,
      employeeId: principal.employeeId ?? null,
      roles,
      canAccessAll: roles.includes('ROLE_ADMIN')
    };
  }

  applyCompanyScope(
    qb: SelectQueryBuilder<any>,
    alias: string,
    context: PrincipalTenantContext,
    options: { selfAlias?: string; selfId?: number } = {}
  ) {
    if (context.canAccessAll) {
      return qb;
    }

    if (context.companyId !== null && context.companyId !== undefined) {
      qb.andWhere(`${alias}.company_id = :tenantCompanyId`, {
        tenantCompanyId: context.companyId
      });
      return qb;
    }

    if (options.selfAlias && options.selfId !== undefined) {
      qb.andWhere(`${options.selfAlias}.id = :tenantSelfId`, {
        tenantSelfId: options.selfId
      });
      return qb;
    }

    qb.andWhere('1 = 0');
    return qb;
  }

  assertResourceAccess(resourceCompanyId: number | null | undefined, context: PrincipalTenantContext, fallbackSelfId?: number) {
    if (context.canAccessAll) {
      return;
    }

    if (resourceCompanyId !== null && resourceCompanyId !== undefined && context.companyId === resourceCompanyId) {
      return;
    }

    if (fallbackSelfId !== undefined && context.userId === fallbackSelfId) {
      return;
    }

    throw new AppError('FORBIDDEN_CROSS_TENANT', 'Recurso fuera del alcance de la empresa', 404);
  }
}
