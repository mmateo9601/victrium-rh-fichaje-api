import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
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

  @Post('clock')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  clock(@CurrentUser() user: { sub: number }, @Body() dto: ClockTimeEntryDto) {
    return this.timeEntriesService.clock(user.sub, dto);
  }

  @Get()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query() query: PaginationQueryDto & { search?: string; numeroUsuario?: string; nombreUsuario?: string; tipo?: string; from?: string; to?: string }
  ) {
    return this.timeEntriesService.list(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  mine(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query() query: PaginationQueryDto & { search?: string; tipo?: string; from?: string; to?: string }
  ) {
    return this.timeEntriesService.findMine(user.sub, query, this.tenantScope.toContext(user));
  }

  @Get(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  byId(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.timeEntriesService.findVisibleById(id, this.tenantScope.toContext(user));
  }

  @Get(':id/audits')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  audits(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.timeEntriesService.listAudits(id, this.tenantScope.toContext(user));
  }

  @Post(':id/correction')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  correct(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrectTimeEntryDto
  ) {
    return this.timeEntriesService.correct(id, dto, this.tenantScope.toContext(user));
  }
}
