import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { VacationEntity } from '../../database/entities/vacation.entity';
import { VacationsController } from './vacations.controller';
import { VacationsService } from './vacations.service';

@Module({
  imports: [TypeOrmModule.forFeature([VacationEntity])],
  controllers: [VacationsController],
  providers: [VacationsService, TenantScopeService]
})
export class VacationsModule {}
