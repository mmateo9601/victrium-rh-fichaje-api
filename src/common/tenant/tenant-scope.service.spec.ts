import { AppError } from '../errors/app-error';
import { TenantScopeService } from './tenant-scope.service';

describe('TenantScopeService', () => {
  it('derives tenant context from authenticated payload', () => {
    const service = new TenantScopeService();
    const context = service.toContext({
      sub: 7,
      companyId: 11,
      employeeId: 19,
      roles: ['ROLE_RRHH']
    });

    expect(context.userId).toBe(7);
    expect(context.companyId).toBe(11);
    expect(context.employeeId).toBe(19);
    expect(context.canAccessAll).toBe(false);
  });

  it('allows global admins to bypass tenant checks', () => {
    const service = new TenantScopeService();
    expect(() =>
      service.assertResourceAccess(999, {
        userId: 1,
        companyId: null,
        employeeId: null,
        roles: ['ROLE_ADMIN'],
        canAccessAll: true
      })
    ).not.toThrow();
  });

  it('rejects cross-tenant access with a 404-style business error', () => {
    const service = new TenantScopeService();

    expect(() =>
      service.assertResourceAccess(22, {
        userId: 5,
        companyId: 11,
        employeeId: 3,
        roles: ['ROLE_RRHH'],
        canAccessAll: false
      })
    ).toThrow(AppError);
  });
});
