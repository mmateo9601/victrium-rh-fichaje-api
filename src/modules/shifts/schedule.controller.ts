import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { ShiftsService } from './shifts.service';

@ApiTags('schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'schedule', version: '1' })
export class ScheduleController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query() query: { from?: string; to?: string; employeeId?: number; shiftId?: number }
  ) {
    return this.shiftsService.getSchedule(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  me(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query() query: { from?: string; to?: string; shiftId?: number }
  ) {
    return this.shiftsService.getMySchedule(this.tenantScope.toContext(user), query);
  }

  @Get('employees/:id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  employee(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Query() query: { from?: string; to?: string; shiftId?: number }
  ) {
    return this.shiftsService.getEmployeeSchedule(id, this.tenantScope.toContext(user), query);
  }
}
