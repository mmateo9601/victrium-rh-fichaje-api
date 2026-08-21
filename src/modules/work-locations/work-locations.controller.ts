import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import {
  CreateEmployeeLocationAssignmentDto,
  CreateWorkLocationDto,
  UpdateEmployeeLocationAssignmentDto,
  UpdateWorkLocationDto
} from './dto/work-location.dto';
import { WorkLocationsService } from './work-locations.service';

@ApiTags('work-locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'work-locations', version: '1' })
export class WorkLocationsController {
  constructor(
    private readonly workLocationsService: WorkLocationsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Query() query: Partial<PaginationQueryDto> & { search?: string; active?: string; companyId?: number }
  ) {
    return this.workLocationsService.list(query, this.tenantScope.toContext(user));
  }

  @Get(':id')
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  byId(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.workLocationsService.findByIdOrFail(id, this.tenantScope.toContext(user));
  }

  @Post()
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  create(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Body() dto: CreateWorkLocationDto) {
    return this.workLocationsService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkLocationDto
  ) {
    return this.workLocationsService.update(id, dto, this.tenantScope.toContext(user));
  }

  @Post(':id/activate')
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  activate(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.workLocationsService.activate(id, this.tenantScope.toContext(user));
  }

  @Post(':id/deactivate')
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  deactivate(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.workLocationsService.deactivate(id, this.tenantScope.toContext(user));
  }

  @Get(':id/employees')
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  employees(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.workLocationsService.listAssignments({ workLocationId: id }, this.tenantScope.toContext(user));
  }

  @Get('assignments/list')
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  assignments(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Query() query: Partial<PaginationQueryDto> & { employeeId?: number; workLocationId?: number }
  ) {
    return this.workLocationsService.listAssignments(query, this.tenantScope.toContext(user));
  }
}

@ApiTags('employee-location-assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'employee-location-assignments', version: '1' })
export class EmployeeLocationAssignmentsController {
  constructor(
    private readonly workLocationsService: WorkLocationsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Query() query: Partial<PaginationQueryDto> & { employeeId?: number; workLocationId?: number }
  ) {
    return this.workLocationsService.listAssignments(query, this.tenantScope.toContext(user));
  }

  @Post()
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  create(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Body() dto: CreateEmployeeLocationAssignmentDto
  ) {
    return this.workLocationsService.createAssignment(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @Roles('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RRHH')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeLocationAssignmentDto
  ) {
    return this.workLocationsService.updateAssignment(id, dto, this.tenantScope.toContext(user));
  }
}
