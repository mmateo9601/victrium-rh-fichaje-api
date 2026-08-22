import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppConfig } from '../config/env.validation';
import { ApiKeyEntity } from './entities/api-key.entity';
import { CompanyEntity } from './entities/company.entity';
import { CalendarDayEntity } from './entities/calendar-day.entity';
import { CalendarEntity } from './entities/calendar.entity';
import { EmployeeEntity } from './entities/employee.entity';
import { EmploymentTermsEntity } from './entities/employment-terms.entity';
import { EmployeeLocationAssignmentEntity } from './entities/employee-location-assignment.entity';
import { IncidentEntity } from './entities/incident.entity';
import { PermissionEntity } from './entities/permission.entity';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { PlanningPeriodEntity } from './entities/planning-period.entity';
import { PlanningPeriodAuditEntity } from './entities/planning-period-audit.entity';
import { RoleEntity } from './entities/role.entity';
import { ShiftAssignmentEntity } from './entities/shift-assignment.entity';
import { ShiftDayEntity } from './entities/shift-day.entity';
import { ShiftEntity } from './entities/shift.entity';
import { ShiftOverrideEntity } from './entities/shift-override.entity';
import { TimeEntryAuditEntity } from './entities/time-entry-audit.entity';
import { TimeEntryBreakEntity } from './entities/time-entry-break.entity';
import { TimeEntryEntity } from './entities/time-entry.entity';
import { TimeEntrySessionEntity } from './entities/time-entry-session.entity';
import { UserEntity } from './entities/user.entity';
import { VacationEntity } from './entities/vacation.entity';
import { WorkLocationEntity } from './entities/work-location.entity';
import { CreateApiKeysTable1724172000000 } from './migrations/1724172000000-CreateApiKeysTable';
import { CreateTimeEntrySessionsTable1724172100000 } from './migrations/1724172100000-CreateTimeEntrySessionsTable';
import { CreateShiftsTables1724172200000 } from './migrations/1724172200000-CreateShiftsTables';
import { CreateWorkLocationsTables1724172300000 } from './migrations/1724172300000-CreateWorkLocationsTables';
import { AddWorkLocationToShiftAssignments1724172400000 } from './migrations/1724172400000-AddWorkLocationToShiftAssignments';
import { CreatePlanningPeriodsTable1724172500000 } from './migrations/1724172500000-CreatePlanningPeriodsTable';
import { CreatePlanningPeriodAuditsTable1724172600000 } from './migrations/1724172600000-CreatePlanningPeriodAuditsTable';
import { AddShiftDaySegments1724172700000 } from './migrations/1724172700000-AddShiftDaySegments';
import { AddShiftRotationColumns1724172800000 } from './migrations/1724172800000-AddShiftRotationColumns';
import { CreateEmploymentTermsTable1724172900000 } from './migrations/1724172900000-CreateEmploymentTermsTable';
import { AddWorkLocationToShiftOverrides1724173000000 } from './migrations/1724173000000-AddWorkLocationToShiftOverrides';

export function createTypeOrmOptions(config: AppConfig): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: config.database.host,
    port: config.database.port,
    username: config.database.user,
    password: config.database.password,
    database: config.database.name,
    entities: [
      UserEntity,
      EmployeeEntity,
      EmploymentTermsEntity,
      CompanyEntity,
      CalendarEntity,
      CalendarDayEntity,
      TimeEntryEntity,
      TimeEntryAuditEntity,
      TimeEntrySessionEntity,
      TimeEntryBreakEntity,
      VacationEntity,
      IncidentEntity,
      PermissionEntity,
      PlanningPeriodEntity,
      PlanningPeriodAuditEntity,
      RoleEntity,
      AuthSessionEntity,
      ApiKeyEntity,
      ShiftEntity,
      ShiftDayEntity,
      ShiftAssignmentEntity,
      ShiftOverrideEntity,
      WorkLocationEntity,
      EmployeeLocationAssignmentEntity
    ],
    migrations: [
      CreateApiKeysTable1724172000000,
      CreateTimeEntrySessionsTable1724172100000,
      CreateShiftsTables1724172200000,
      CreateWorkLocationsTables1724172300000,
      AddWorkLocationToShiftAssignments1724172400000,
      CreatePlanningPeriodsTable1724172500000,
      CreatePlanningPeriodAuditsTable1724172600000,
      AddShiftDaySegments1724172700000,
      AddShiftRotationColumns1724172800000,
      CreateEmploymentTermsTable1724172900000,
      AddWorkLocationToShiftOverrides1724173000000
    ],
    migrationsRun: true,
    synchronize: false,
    logging: config.nodeEnv === 'development',
    autoLoadEntities: false,
    timezone: 'Z',
    extra: {
      connectionLimit: 10
    }
  };
}
