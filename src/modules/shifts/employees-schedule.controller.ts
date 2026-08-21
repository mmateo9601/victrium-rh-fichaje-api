import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { ShiftsService } from './shifts.service';

@ApiTags('employee-schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'employees', version: '1' })
export class EmployeeScheduleController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get(':id/shifts')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  assignments(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.shiftsService.getEmployeeAssignments(id, this.tenantScope.toContext(user));
  }

  @Get(':id/schedule')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  schedule(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Query() query: { from?: string; to?: string; shiftId?: number }
  ) {
    return this.shiftsService.getEmployeeSchedule(id, this.tenantScope.toContext(user), query);
  }
}
