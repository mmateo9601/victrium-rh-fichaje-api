import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { ApiKeyEntity } from '../../database/entities/api-key.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyEntity, UserEntity, CompanyEntity]), UsersModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, TenantScopeService],
  exports: [ApiKeysService]
})
export class ApiKeysModule {}
