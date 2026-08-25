import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { DepartmentEntity } from '../../database/entities/department.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { TeamEntity } from '../../database/entities/team.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamEntity, CompanyEntity, DepartmentEntity, EmployeeEntity])],
  controllers: [TeamsController],
  providers: [TeamsService, TenantScopeService],
  exports: [TeamsService]
})
export class TeamsModule {}
