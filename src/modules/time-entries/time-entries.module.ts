import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../../database/entities/user.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { TimeEntryAuditEntity } from '../../database/entities/time-entry-audit.entity';
import { TimeEntrySessionEntity } from '../../database/entities/time-entry-session.entity';
import { TimeEntryBreakEntity } from '../../database/entities/time-entry-break.entity';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { UsersModule } from '../users/users.module';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService } from './time-entries.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([TimeEntryEntity, TimeEntryAuditEntity, TimeEntrySessionEntity, TimeEntryBreakEntity, UserEntity])],
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService, TenantScopeService],
  exports: [TimeEntriesService]
})
export class TimeEntriesModule {}
