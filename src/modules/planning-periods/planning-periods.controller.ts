import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CreatePlanningPeriodDto, UpdatePlanningPeriodDto } from './dto/planning-period.dto';
import { PlanningPeriodsService } from './planning-periods.service';

@ApiTags('planning-periods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'planning-periods', version: '1' })
export class PlanningPeriodsController {
  constructor(
    private readonly planningPeriodsService: PlanningPeriodsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Query() query: { page?: number; pageSize?: number; search?: string; status?: 'DRAFT' | 'PUBLISHED'; companyId?: number }
  ) {
    return this.planningPeriodsService.list(query, this.tenantScope.toContext(user));
  }

  @Get(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  byId(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.planningPeriodsService.findByIdOrFail(id, this.tenantScope.toContext(user));
  }

  @Post()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  create(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Body() dto: CreatePlanningPeriodDto) {
    return this.planningPeriodsService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanningPeriodDto
  ) {
    return this.planningPeriodsService.update(id, dto, this.tenantScope.toContext(user));
  }

  @Post(':id/publish')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  publish(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.planningPeriodsService.publish(id, this.tenantScope.toContext(user));
  }

  @Post(':id/unpublish')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  unpublish(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.planningPeriodsService.unpublish(id, this.tenantScope.toContext(user));
  }

  @Get(':id/audits')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  audits(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.planningPeriodsService.listAudits(id, this.tenantScope.toContext(user));
  }
}
