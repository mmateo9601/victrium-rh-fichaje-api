import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CalendarEntity } from '../../database/entities/calendar.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { UsersModule } from '../users/users.module';
import { WorkLocationsModule } from '../work-locations/work-locations.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity, CalendarEntity]), UsersModule, WorkLocationsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, TenantScopeService],
  exports: [CompaniesService]
})
export class CompaniesModule {}
