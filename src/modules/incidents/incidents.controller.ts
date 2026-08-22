import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentsService } from './incidents.service';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'incidents', version: '1' })
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query()
    query: PaginationQueryDto & {
      search?: string;
      resuelta?: string;
      diaDesde?: string;
      diaHasta?: string;
      employeeId?: number;
    }
  ) {
    return this.incidentsService.list(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  me(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query()
    query: PaginationQueryDto & {
      search?: string;
      resuelta?: string;
      diaDesde?: string;
      diaHasta?: string;
    }
  ) {
    return this.incidentsService.listMine(query, this.tenantScope.toContext(user));
  }

  @Post()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  create(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Body() dto: CreateIncidentDto
  ) {
    return this.incidentsService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncidentDto
  ) {
    return this.incidentsService.update(id, dto, this.tenantScope.toContext(user));
  }

  @Patch(':id/resolve')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  resolve(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.incidentsService.markResolved(id, this.tenantScope.toContext(user));
  }

  @Get('stats/months')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  months(@CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }) {
    return this.incidentsService.countLast12Months(this.tenantScope.toContext(user));
  }

  @Get('stats/users')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  users(@CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }) {
    return this.incidentsService.countUsersLast12Months(this.tenantScope.toContext(user));
  }

  @Get('stats/top')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  top(@CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }) {
    return this.incidentsService.topIncidenciasLast12Months(this.tenantScope.toContext(user));
  }

  @Get(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  byId(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.incidentsService.getVisibleIncident(id, this.tenantScope.toContext(user));
  }
}
