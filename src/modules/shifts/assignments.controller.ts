import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { CreateShiftAssignmentDto, CreateShiftOverrideDto, UpdateShiftAssignmentDto, UpdateShiftOverrideDto } from './dto/shift.dto';
import { ShiftsService } from './shifts.service';

@ApiTags('shift-assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'shift-assignments', version: '1' })
export class ShiftAssignmentsController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Query() query: { employeeId?: number; shiftId?: number; active?: string }
  ) {
    return this.shiftsService.listAssignments(query, this.tenantScope.toContext(user));
  }

  @Post()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  create(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Body() dto: CreateShiftAssignmentDto
  ) {
    return this.shiftsService.createAssignment(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShiftAssignmentDto
  ) {
    return this.shiftsService.updateAssignment(id, dto, this.tenantScope.toContext(user));
  }

  @Post('/overrides')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  createOverride(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Body() dto: CreateShiftOverrideDto
  ) {
    return this.shiftsService.createOverride(dto, this.tenantScope.toContext(user));
  }

  @Patch('/overrides/:id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  updateOverride(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShiftOverrideDto
  ) {
    return this.shiftsService.updateOverride(id, dto, this.tenantScope.toContext(user));
  }

  @Get('/overrides')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  listOverrides(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Query() query: { employeeId?: number; date?: string }
  ) {
    return this.shiftsService.listOverrides(query, this.tenantScope.toContext(user));
  }
}
