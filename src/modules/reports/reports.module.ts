import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { PlanningPeriodEntity } from '../../database/entities/planning-period.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { ShiftEntity } from '../../database/entities/shift.entity';
import { TimeEntrySessionEntity } from '../../database/entities/time-entry-session.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { VacationEntity } from '../../database/entities/vacation.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      UserEntity,
      EmployeeEntity,
      WorkLocationEntity,
      ShiftEntity,
      PlanningPeriodEntity,
      TimeEntryEntity,
      TimeEntrySessionEntity,
      VacationEntity,
      PermissionEntity,
      IncidentEntity
    ])
  ],
  controllers: [ReportsController],
  providers: [ReportsService, TenantScopeService]
})
export class ReportsModule {}
