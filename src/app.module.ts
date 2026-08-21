import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { JwtAuthGuard } from './common/auth/jwt.guard';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { HealthModule } from './modules/health/health.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { VacationsModule } from './modules/vacations/vacations.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { CalendarsModule } from './modules/calendars/calendars.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { UsersModule } from './modules/users/users.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { PlanningPeriodsModule } from './modules/planning-periods/planning-periods.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WorkLocationsModule } from './modules/work-locations/work-locations.module';
import { RolesGuard } from './common/auth/roles.guard';

@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    HealthModule,
    UsersModule,
    AuthModule,
    CompaniesModule,
    EmployeesModule,
    VacationsModule,
    IncidentsModule,
    CalendarsModule,
    ApiKeysModule,
    PermissionsModule,
    TimeEntriesModule,
    ShiftsModule,
    PlanningPeriodsModule,
    ReportsModule,
    WorkLocationsModule
  ],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
