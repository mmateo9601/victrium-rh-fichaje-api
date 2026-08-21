import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';
import { ShiftsService } from './shifts.service';

@ApiTags('shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'shifts', version: '1' })
export class ShiftsController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  list(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Query() query: { search?: string; active?: string }) {
    return this.shiftsService.list(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  me(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query() query: { from?: string; to?: string; date?: string }
  ) {
    const context = this.tenantScope.toContext(user);
    const date = query.date ?? new Date().toISOString().slice(0, 10);
    const from = query.from ?? date;
    const to = query.to ?? date;
    return this.shiftsService.getMySchedule(context, { from, to });
  }

  @Get(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  byId(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.shiftsService.findByIdOrFail(id, this.tenantScope.toContext(user));
  }

  @Post()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  create(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Body() dto: CreateShiftDto
  ) {
    return this.shiftsService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShiftDto
  ) {
    return this.shiftsService.update(id, dto, this.tenantScope.toContext(user));
  }

  @Post(':id/activate')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  activate(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.shiftsService.activate(id, this.tenantScope.toContext(user));
  }

  @Post(':id/deactivate')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  deactivate(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.shiftsService.deactivate(id, this.tenantScope.toContext(user));
  }

  @Get(':id/assignments')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  assignments(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.shiftsService.listAssignments({ shiftId: id }, this.tenantScope.toContext(user));
  }
}
