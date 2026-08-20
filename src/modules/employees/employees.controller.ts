import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'employees', version: '1' })
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query() query: PaginationQueryDto & { search?: string; active?: string; working?: string; companyId?: number }
  ) {
    return this.employeesService.list(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  me(@CurrentUser() user: { sub: number }) {
    return this.employeesService.findMine(user.sub);
  }

  @Get(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  byId(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.employeesService.getVisibleEmployee(id, this.tenantScope.toContext(user));
  }

  @Post()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  create(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Body() dto: CreateEmployeeDto
  ) {
    return this.employeesService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto
  ) {
    return this.employeesService.update(id, dto, this.tenantScope.toContext(user));
  }

  @Patch(':id/activate')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  activate(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.employeesService.setActive(id, true, this.tenantScope.toContext(user));
  }

  @Patch(':id/deactivate')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  deactivate(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.employeesService.setActive(id, false, this.tenantScope.toContext(user));
  }
}
