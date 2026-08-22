import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get('summary')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  summary(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }) {
    return this.reportsService.summary(this.tenantScope.toContext(user));
  }
}
