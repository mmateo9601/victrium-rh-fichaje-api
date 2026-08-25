import { DataSource } from 'typeorm';

import { SuperAdminBootstrapService } from '../bootstrap/super-admin.bootstrap';
import { DatabaseBootstrapService } from './database-bootstrap.service';

describe('DatabaseBootstrapService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      PORT: '3001',
      CORS_ORIGINS: 'http://localhost:3000',
      TZ: 'Europe/Madrid',
      JWT_ACCESS_SECRET: 'access-secret-access-secret-access-secret-0001',
      JWT_REFRESH_SECRET: 'refresh-secret-refresh-secret-refresh-secret-0001',
      DATABASE_URL: 'mysql://user:pass@localhost:3306/test',
      BOOTSTRAP_SUPER_ADMIN: 'true',
      SUPER_ADMIN_EMAIL: 'admin@example.com',
      SUPER_ADMIN_PASSWORD: 'AdminPassword123',
      SUPER_ADMIN_NAME: 'Platform Admin',
      DATABASE_AUTO_MIGRATE: 'true'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('runs migrations and bootstraps the super admin on startup', async () => {
    const queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('GET_LOCK')) {
          return [{ locked: 1 }];
        }
        return [];
      }),
      release: jest.fn().mockResolvedValue(undefined)
    } as any;

    const dataSource = {
      isInitialized: true,
      runMigrations: jest.fn().mockResolvedValue([{ name: 'TestMigration' }]),
      createQueryRunner: jest.fn().mockReturnValue(queryRunner)
    } as unknown as DataSource;

    const bootstrapSpy = jest.spyOn(SuperAdminBootstrapService.prototype, 'run').mockResolvedValue('already_exists');
    const service = new DatabaseBootstrapService(dataSource);

    await service.run();

    expect(dataSource.runMigrations).toHaveBeenCalledTimes(1);
    expect(bootstrapSpy).toHaveBeenCalledTimes(1);
    expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
