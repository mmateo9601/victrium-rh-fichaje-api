import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../../database/entities/user.entity';
import { TimeEntryEntity } from '../../database/entities/time-entry.entity';
import { UsersModule } from '../users/users.module';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService } from './time-entries.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([TimeEntryEntity, UserEntity])],
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService],
  exports: [TimeEntriesService]
})
export class TimeEntriesModule {}
