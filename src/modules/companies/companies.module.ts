import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CalendarEntity } from '../../database/entities/calendar.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { PlanningPeriodEntity } from '../../database/entities/planning-period.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { WorkLocationEntity } from '../../database/entities/work-location.entity';
import { UsersModule } from '../users/users.module';
import { WorkLocationsModule } from '../work-locations/work-locations.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyEntity, CalendarEntity, EmployeeEntity, UserEntity, WorkLocationEntity, PlanningPeriodEntity]),
    UsersModule,
    WorkLocationsModule
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService, TenantScopeService],
  exports: [CompaniesService]
})
export class CompaniesModule {}
