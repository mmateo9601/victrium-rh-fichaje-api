import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'departments', version: '1' })
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Query() query: Partial<PaginationQueryDto> & { search?: string; active?: string; companyId?: number }
  ) {
    return this.departmentsService.list(query, this.tenantScope.toContext(user));
  }

  @Get(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  get(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.get(id, this.tenantScope.toContext(user));
  }

  @Post()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  create(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto
  ) {
    return this.departmentsService.update(id, dto, this.tenantScope.toContext(user));
  }

  @Patch(':id/activate')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  activate(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.activate(id, this.tenantScope.toContext(user));
  }

  @Patch(':id/deactivate')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  deactivate(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.deactivate(id, this.tenantScope.toContext(user));
  }

  @Delete(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  delete(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.delete(id, this.tenantScope.toContext(user));
  }
}
