import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { hasAnyRole, normalizeRoleNames } from './role-access';
import { AppError } from '../errors/app-error';
import { ROLES_KEY } from './roles.decorator';
import { RoleName } from '../../database/entities/role-name.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { roles?: string[] } }>();
    const userRoles = normalizeRoleNames(request.user?.roles ?? []);
    const normalizedRequiredRoles = requiredRoles.map((role) => normalizeRoleNames([role])[0] ?? role);

    if (hasAnyRole(userRoles, [RoleName.ROLE_SUPER_ADMIN])) {
      return true;
    }

    const allowed = normalizedRequiredRoles.some((role) => userRoles.includes(role));
    if (!allowed) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    }

    return true;
  }
}
