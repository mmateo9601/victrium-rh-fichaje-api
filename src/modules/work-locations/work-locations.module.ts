import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CalendarEntity } from '../../database/entities/calendar.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { EmployeeLocationAssignmentEntity } from '../../database/entities/employee-location-assignment.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import { WorkLocationsController, EmployeeLocationAssignmentsController } from './work-locations.controller';
import { WorkLocationsService } from './work-locations.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkLocationEntity, EmployeeLocationAssignmentEntity, EmployeeEntity, CompanyEntity, CalendarEntity])],
  controllers: [WorkLocationsController, EmployeeLocationAssignmentsController],
  providers: [WorkLocationsService, TenantScopeService],
  exports: [WorkLocationsService]
})
export class WorkLocationsModule {}
