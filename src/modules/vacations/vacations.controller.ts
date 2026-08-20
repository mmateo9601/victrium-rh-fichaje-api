import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { VacationsService } from './vacations.service';

@ApiTags('vacations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'vacations', version: '1' })
export class VacationsController {
  constructor(
    private readonly vacationsService: VacationsService,
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
      consumidas?: string;
      aprobado?: string;
      inicioDesde?: string;
      inicioHasta?: string;
      finDesde?: string;
      finHasta?: string;
      employeeId?: number;
    }
  ) {
    return this.vacationsService.list(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  me(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query()
    query: PaginationQueryDto & {
      search?: string;
      estado?: string;
      consumidas?: string;
      aprobado?: string;
      inicioDesde?: string;
      inicioHasta?: string;
      finDesde?: string;
      finHasta?: string;
    }
  ) {
    return this.vacationsService.listMine(query, this.tenantScope.toContext(user));
  }

  @Get(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  async byId(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.vacationsService.getVisibleVacation(id, this.tenantScope.toContext(user));
  }

  @Post()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  create(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Body() dto: CreateVacationDto
  ) {
    return this.vacationsService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id/approve')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  approve(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.vacationsService.approve(id, this.tenantScope.toContext(user));
  }

  @Patch(':id/deny')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  deny(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.vacationsService.deny(id, this.tenantScope.toContext(user));
  }
}
