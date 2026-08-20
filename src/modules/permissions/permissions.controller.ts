import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionsService } from './permissions.service';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'permissions', version: '1' })
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query()
    query: PaginationQueryDto & {
      search?: string;
      estado?: string;
      aprobado?: string;
      diaDesde?: string;
      diaHasta?: string;
      horaInicioDesde?: string;
      horaInicioHasta?: string;
      horaFinDesde?: string;
      horaFinHasta?: string;
      employeeId?: number;
      employeeNumero?: string;
      employeeNombre?: string;
      employeeDni?: string;
      employeeEmail?: string;
    }
  ) {
    return this.permissionsService.list(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  me(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query()
    query: PaginationQueryDto & {
      search?: string;
      estado?: string;
      aprobado?: string;
      diaDesde?: string;
      diaHasta?: string;
      horaInicioDesde?: string;
      horaInicioHasta?: string;
      horaFinDesde?: string;
      horaFinHasta?: string;
      employeeNumero?: string;
      employeeNombre?: string;
      employeeDni?: string;
      employeeEmail?: string;
    }
  ) {
    return this.permissionsService.listMine(query, this.tenantScope.toContext(user));
  }

  @Get('stats/months')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  months(@CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }) {
    return this.permissionsService.countLast12Months(this.tenantScope.toContext(user));
  }

  @Get('stats/users')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  users(@CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }) {
    return this.permissionsService.countUsersLast12Months(this.tenantScope.toContext(user));
  }

  @Get(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  byId(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.permissionsService.getVisiblePermission(id, this.tenantScope.toContext(user));
  }

  @Post()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  create(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Body() dto: CreatePermissionDto
  ) {
    return this.permissionsService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id/approve')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  approve(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.permissionsService.approve(id, this.tenantScope.toContext(user));
  }

  @Patch(':id/deny')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  deny(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.permissionsService.deny(id, this.tenantScope.toContext(user));
  }

  @Delete(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  remove(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.permissionsService.delete(id, this.tenantScope.toContext(user));
  }
}
