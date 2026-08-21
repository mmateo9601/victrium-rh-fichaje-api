import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { PlanningPeriodEntity } from '../../database/entities/planning-period.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { PlanningPeriodsController } from './planning-periods.controller';
import { PlanningPeriodsService } from './planning-periods.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlanningPeriodEntity, CompanyEntity, UserEntity])],
  controllers: [PlanningPeriodsController],
  providers: [PlanningPeriodsService, TenantScopeService]
})
export class PlanningPeriodsModule {}
