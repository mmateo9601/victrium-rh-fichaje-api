import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { TeamsService } from './teams.service';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'teams', version: '1' })
export class TeamsController {
  constructor(private readonly teamsService: TeamsService, private readonly tenantScope: TenantScopeService) {}

  @Get()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Query() query: Partial<PaginationQueryDto> & { search?: string; active?: string; companyId?: number }
  ) {
    return this.teamsService.list(query, this.tenantScope.toContext(user));
  }

  @Get(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  get(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.teamsService.get(id, this.tenantScope.toContext(user));
  }

  @Post()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  create(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamDto
  ) {
    return this.teamsService.update(id, dto, this.tenantScope.toContext(user));
  }

  @Patch(':id/activate')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  activate(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.teamsService.activate(id, this.tenantScope.toContext(user));
  }

  @Patch(':id/deactivate')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  deactivate(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.teamsService.deactivate(id, this.tenantScope.toContext(user));
  }

  @Delete(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  delete(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.teamsService.delete(id, this.tenantScope.toContext(user));
  }
}
