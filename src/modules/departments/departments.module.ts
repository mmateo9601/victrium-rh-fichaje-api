import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { DepartmentEntity } from '../../database/entities/department.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

@Module({
  imports: [TypeOrmModule.forFeature([DepartmentEntity, CompanyEntity, EmployeeEntity])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, TenantScopeService],
  exports: [DepartmentsService]
})
export class DepartmentsModule {}
