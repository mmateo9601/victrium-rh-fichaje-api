import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { ClockTimeEntryDto } from './dto/clock-time-entry.dto';
import { CorrectTimeEntryDto } from './dto/correct-time-entry.dto';
import { TimeEntriesService } from './time-entries.service';

@ApiTags('time-entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'time-entries', version: '1' })
export class TimeEntriesController {
  constructor(
    private readonly timeEntriesService: TimeEntriesService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get('me/current')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  current(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }
  ) {
    return this.timeEntriesService.current(user.sub, this.tenantScope.toContext(user));
  }

  @Get('me/eligibility')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  eligibility(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }
  ) {
    return this.timeEntriesService.eligibility(user.sub, this.tenantScope.toContext(user));
  }

  @Post('start')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  start(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Body() dto: ClockTimeEntryDto
  ) {
    return this.timeEntriesService.start(user.sub, dto, this.tenantScope.toContext(user));
  }

  @Post('clock')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  clock(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Body() dto: ClockTimeEntryDto
  ) {
    return this.timeEntriesService.clock(user.sub, dto, this.tenantScope.toContext(user));
  }

  @Get()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query() query: PaginationQueryDto & { search?: string; numeroUsuario?: string; nombreUsuario?: string; tipo?: string; from?: string; to?: string }
  ) {
    return this.timeEntriesService.list(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  mine(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query() query: PaginationQueryDto & { search?: string; tipo?: string; from?: string; to?: string }
  ) {
    return this.timeEntriesService.findMine(user.sub, query, this.tenantScope.toContext(user));
  }

  @Get(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  byId(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.timeEntriesService.findVisibleById(id, this.tenantScope.toContext(user));
  }

  @Post('me/pause')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  pauseMine(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }
  ) {
    return this.timeEntriesService.pause(user.sub, this.tenantScope.toContext(user));
  }

  @Post('me/resume')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  resumeMine(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }
  ) {
    return this.timeEntriesService.resume(user.sub, this.tenantScope.toContext(user));
  }

  @Post('me/finish')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  finishMine(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }
  ) {
    return this.timeEntriesService.finish(user.sub, this.tenantScope.toContext(user));
  }

  @Post(':id/pause')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  pause(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.timeEntriesService.pauseSession(id, this.tenantScope.toContext(user));
  }

  @Post(':id/resume')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  resume(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.timeEntriesService.resumeSession(id, this.tenantScope.toContext(user));
  }

  @Post(':id/finish')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  finish(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.timeEntriesService.finishSession(id, this.tenantScope.toContext(user));
  }

  @Get(':id/audits')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  audits(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.timeEntriesService.listAudits(id, this.tenantScope.toContext(user));
  }

  @Post(':id/correction')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  correct(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrectTimeEntryDto
  ) {
    return this.timeEntriesService.correct(id, dto, this.tenantScope.toContext(user));
  }
}
