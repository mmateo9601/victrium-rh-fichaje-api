import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppConfig } from '../config/env.validation';
import { CompanyEntity } from './entities/company.entity';
import { CalendarDayEntity } from './entities/calendar-day.entity';
import { CalendarEntity } from './entities/calendar.entity';
import { EmployeeEntity } from './entities/employee.entity';
import { IncidentEntity } from './entities/incident.entity';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { RoleEntity } from './entities/role.entity';
import { TimeEntryEntity } from './entities/time-entry.entity';
import { UserEntity } from './entities/user.entity';
import { VacationEntity } from './entities/vacation.entity';

export function createTypeOrmOptions(config: AppConfig): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: config.database.host,
    port: config.database.port,
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    entities: [UserEntity, EmployeeEntity, CompanyEntity, CalendarEntity, CalendarDayEntity, TimeEntryEntity, VacationEntity, IncidentEntity, RoleEntity, AuthSessionEntity],
    synchronize: false,
    logging: config.nodeEnv === 'development',
    autoLoadEntities: false,
    timezone: 'Z',
    extra: {
      connectionLimit: 10
    }
  };
}
