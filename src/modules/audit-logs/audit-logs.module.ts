import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity, CompanyEntity, UserEntity])],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, TenantScopeService],
  exports: [AuditLogsService]
})
export class AuditLogsModule {}
