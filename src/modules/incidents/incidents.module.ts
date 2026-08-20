import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { IncidentEntity } from '../../database/entities/incident.entity';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [TypeOrmModule.forFeature([IncidentEntity])],
  controllers: [IncidentsController],
  providers: [IncidentsService, TenantScopeService]
})
export class IncidentsModule {}
