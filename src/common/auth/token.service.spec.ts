import { TokenService } from './token.service';
import { AppConfig } from '../../config/env.validation';

function createConfig(): AppConfig {
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
        enabled: false
      }
    },
    database: {
      host: 'localhost',
      port: 3306,
      name: 'fichaje',
      user: 'fichaje',
      password: 'test-password-test-password-test-0001'
    },
    jwt: {
      accessSecret: 'access-secret',
      refreshSecret: 'refresh-secret',
      accessExpiresIn: '15m',
      refreshExpiresIn: '7d'
    }
  };
}

describe('TokenService', () => {
  it('signs and verifies access tokens', () => {
    const service = new TokenService(createConfig());
    const token = service.signAccessToken({
      sub: 1,
      numero: 'EMP001',
      nombreEmpleado: 'Ada Lovelace',
      roles: ['ROLE_USER'],
      sid: 'session-1'
    });

    const payload = service.verifyAccessToken(token);
    expect(payload.sub).toBe(1);
    expect(payload.numero).toBe('EMP001');
    expect(payload.roles).toContain('ROLE_USER');
  });
});
