import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppConfig } from '../config/env.validation';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { RoleEntity } from './entities/role.entity';
import { TimeEntryEntity } from './entities/time-entry.entity';
import { UserEntity } from './entities/user.entity';

export function createTypeOrmOptions(config: AppConfig): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    url: config.database.url,
    host: config.database.host,
    port: config.database.port,
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    entities: [UserEntity, TimeEntryEntity, RoleEntity, AuthSessionEntity],
    synchronize: false,
    logging: config.nodeEnv === 'development',
    autoLoadEntities: false,
    timezone: 'Z',
    extra: {
      connectionLimit: 10
    }
  };
}
