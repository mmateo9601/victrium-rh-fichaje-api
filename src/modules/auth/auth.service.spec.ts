jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

import * as bcrypt from 'bcryptjs';

import { TokenService } from '../../common/auth/token.service';
import { createAppConfig } from '../../config/env.validation';
import { RoleName } from '../../database/entities/role-name.enum';
import { UserEntity } from '../../database/entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService super-admin compatibility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      PORT: '3001',
      DATABASE_URL: 'mysql://user:pass@localhost:3306/test',
      JWT_ACCESS_SECRET: 'access-secret-access-secret-access-secret-0001',
      JWT_REFRESH_SECRET: 'refresh-secret-refresh-secret-refresh-secret-0001',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      CORS_ORIGINS: 'http://localhost:3000'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('logs in a super admin without company or employee relations', async () => {
    const user = {
      id: 1,
      email: 'admin@example.com',
      password: 'hashed-password',
      numero: 'ADMIN001',
      nombreEmpleado: 'Platform Admin',
      dni: 'SUPERADMIN001',
      company: null,
      employee: null,
      roles: [{ id: 1, rolNombre: RoleName.ROLE_SUPER_ADMIN }]
    } as UserEntity;

    const usersService = {
      findByNumeroOrEmailOrFail: jest.fn().mockResolvedValue(user),
      toPublicUser: jest.fn().mockReturnValue({
        id: 1,
        numero: 'ADMIN001',
        nombreEmpleado: 'Platform Admin',
        companyId: null,
        employeeId: null,
        roles: [RoleName.ROLE_SUPER_ADMIN],
        admin: false
      })
    };
    const sessionsRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => value),
      createQueryBuilder: jest.fn()
    };

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('refresh-token-hash');

    const service = new AuthService(usersService as never, sessionsRepository as never);
    const response = await service.login({ numero: 'admin@example.com', password: 'Password1234' }, 'Mozilla/5.0');

    expect(response.user.companyId).toBeNull();
    expect(response.user.employeeId).toBeNull();

    const tokenService = new TokenService(createAppConfig(process.env));
    const accessPayload = tokenService.verifyAccessToken(response.accessToken);
    expect(accessPayload.companyId).toBeNull();
    expect(accessPayload.employeeId).toBeNull();
    expect(accessPayload.roles).toContain(RoleName.ROLE_SUPER_ADMIN);
    expect(sessionsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        user,
        userAgent: 'Mozilla/5.0'
      })
    );
  });

  it('returns a public profile for a super admin without company or employee relations', async () => {
    const user = {
      id: 1,
      email: 'admin@example.com',
      password: 'hashed-password',
      numero: 'ADMIN001',
      nombreEmpleado: 'Platform Admin',
      dni: 'SUPERADMIN001',
      company: null,
      employee: null,
      roles: [{ id: 1, rolNombre: RoleName.ROLE_SUPER_ADMIN }]
    } as UserEntity;

    const usersService = {
      findById: jest.fn().mockResolvedValue(user),
      toPublicUser: jest.fn().mockReturnValue({
        id: 1,
        numero: 'ADMIN001',
        nombreEmpleado: 'Platform Admin',
        companyId: null,
        employeeId: null,
        roles: [RoleName.ROLE_SUPER_ADMIN],
        admin: false
      })
    };

    const service = new AuthService(usersService as never, {} as never);
    const response = await service.me(1);

    expect(response.companyId).toBeNull();
    expect(response.employeeId).toBeNull();
  });
});
