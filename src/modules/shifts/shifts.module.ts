import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CalendarDayEntity } from '../../database/entities/calendar-day.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { PermissionEntity } from '../../database/entities/permission.entity';
import { ShiftAssignmentEntity } from '../../database/entities/shift-assignment.entity';
import { ShiftDayEntity } from '../../database/entities/shift-day.entity';
import { ShiftEntity } from '../../database/entities/shift.entity';
import { ShiftOverrideEntity } from '../../database/entities/shift-override.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { VacationEntity } from '../../database/entities/vacation.entity';
import { ScheduleController } from './schedule.controller';
import { EmployeeScheduleController } from './employees-schedule.controller';
import { ShiftAssignmentsController } from './assignments.controller';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { WorkScheduleResolverService } from './work-schedule-resolver.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShiftEntity,
      ShiftDayEntity,
      ShiftAssignmentEntity,
      ShiftOverrideEntity,
      EmployeeEntity,
      CalendarDayEntity,
      VacationEntity,
      PermissionEntity,
      IncidentEntity,
      TimeEntryEntity,
      CompanyEntity
    ])
  ],
  controllers: [ShiftsController, ShiftAssignmentsController, ScheduleController, EmployeeScheduleController],
  providers: [ShiftsService, WorkScheduleResolverService, TenantScopeService]
})
export class ShiftsModule {}
