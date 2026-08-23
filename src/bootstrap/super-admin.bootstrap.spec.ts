import { DataSource } from 'typeorm';

import { AppConfig } from '../config/env.validation';
import { RoleName } from '../database/entities/role-name.enum';
import { RoleEntity } from '../database/entities/role.entity';
import { UserEntity } from '../database/entities/user.entity';
import { SuperAdminBootstrapService } from './super-admin.bootstrap';

function createConfig(overrides: Partial<AppConfig['bootstrap']['superAdmin']> = {}): AppConfig {
  return {
    nodeEnv: 'test',
    port: 3001,
    corsOrigins: ['http://localhost:3000'],
    tz: 'Europe/Madrid',
    logLevel: 'log',
    swaggerEnabled: false,
    trustProxy: false,
    bootstrap: {
      superAdmin: {
        enabled: true,
        email: 'admin@example.com',
        password: 'AdminPassword123',
        name: 'Platform Admin',
        ...overrides
      }
    },
    database: {
      url: 'mysql://user:pass@localhost:3306/test'
    },
    jwt: {
      accessSecret: 'access-secret-access-secret-access-secret-0001',
      refreshSecret: 'refresh-secret-refresh-secret-refresh-secret-0001',
      accessExpiresIn: '15m',
      refreshExpiresIn: '7d'
    }
  };
}

describe('SuperAdminBootstrapService', () => {
  it('creates the super admin with a hashed password', async () => {
    const superAdminRole = { id: 1, rolNombre: RoleName.ROLE_SUPER_ADMIN } as RoleEntity;
    const savedUsers: UserEntity[] = [];
    const roleRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => value)
    };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => {
        savedUsers.push(value);
        return value;
      })
    };
    const dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) =>
        callback({
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === RoleEntity) {
              return roleRepository;
            }
            if (entity === UserEntity) {
              return userRepository;
            }
            throw new Error('Unexpected entity');
          })
        })
      )
    } as unknown as DataSource;

    roleRepository.save.mockResolvedValue(superAdminRole);
    const service = new SuperAdminBootstrapService(dataSource, createConfig());
    const result = await service.run();

    expect(result).toBe('created');
    expect(roleRepository.save).toHaveBeenCalledWith(expect.objectContaining({ rolNombre: RoleName.ROLE_SUPER_ADMIN }));
    expect(savedUsers).toHaveLength(1);
    expect(savedUsers[0].password).not.toBe('AdminPassword123');
    expect(savedUsers[0].roles).toHaveLength(1);
    expect(savedUsers[0].roles[0].rolNombre).toBe(RoleName.ROLE_SUPER_ADMIN);
  });

  it('returns already_exists without changing the password when the user already has super admin', async () => {
    const existingUser = {
      id: 1,
      email: 'admin@example.com',
      password: 'existing-hash',
      numero: 'admin@example.com',
      nombreEmpleado: 'Platform Admin',
      dni: 'super-admin:admin@example.com',
      roles: [{ id: 1, rolNombre: RoleName.ROLE_SUPER_ADMIN }]
    } as UserEntity;
    const roleRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 1, rolNombre: RoleName.ROLE_SUPER_ADMIN }),
      create: jest.fn(),
      save: jest.fn()
    };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(existingUser),
      create: jest.fn(),
      save: jest.fn()
    };
    const dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) =>
        callback({
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === RoleEntity) {
              return roleRepository;
            }
            if (entity === UserEntity) {
              return userRepository;
            }
            throw new Error('Unexpected entity');
          })
        })
      )
    } as unknown as DataSource;

    const service = new SuperAdminBootstrapService(dataSource, createConfig());
    const result = await service.run();

    expect(result).toBe('already_exists');
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('fails when the bootstrap email already belongs to a non super-admin user', async () => {
    const existingUser = {
      id: 1,
      email: 'admin@example.com',
      password: 'existing-hash',
      numero: 'admin@example.com',
      nombreEmpleado: 'Platform Admin',
      dni: 'super-admin:admin@example.com',
      roles: [{ id: 2, rolNombre: RoleName.ROLE_COMPANY_ADMIN }]
    } as UserEntity;
    const roleRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 1, rolNombre: RoleName.ROLE_SUPER_ADMIN }),
      create: jest.fn(),
      save: jest.fn()
    };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(existingUser),
      create: jest.fn(),
      save: jest.fn()
    };
    const dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) =>
        callback({
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === RoleEntity) {
              return roleRepository;
            }
            if (entity === UserEntity) {
              return userRepository;
            }
            throw new Error('Unexpected entity');
          })
        })
      )
    } as unknown as DataSource;

    const service = new SuperAdminBootstrapService(dataSource, createConfig());

    await expect(service.run()).rejects.toMatchObject({
      code: 'SUPER_ADMIN_BOOTSTRAP_CONFLICT',
      statusCode: 409
    });
  });
});
