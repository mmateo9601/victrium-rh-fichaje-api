import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CompanyEntity } from '../../database/entities/company.entity';
import { CompanySettingEntity } from '../../database/entities/company-setting.entity';
import { CompanySettingsController } from './company-settings.controller';
import { CompanySettingsService } from './company-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompanySettingEntity, CompanyEntity])],
  controllers: [CompanySettingsController],
  providers: [CompanySettingsService, TenantScopeService],
  exports: [CompanySettingsService]
})
export class CompanySettingsModule {}
