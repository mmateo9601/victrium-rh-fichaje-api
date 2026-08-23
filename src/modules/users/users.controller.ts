import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantScope: TenantScopeService
  ) {}

  @Get()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Query() query: PaginationQueryDto & { search?: string; role?: string; active?: string; companyId?: number; employeeId?: number }
  ) {
    return this.usersService.list(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  async me(@CurrentUser() user: { sub: number }) {
    const entity = await this.usersService.findByIdOrFail(user.sub);
    return this.usersService.toPublicUser(entity);
  }

  @Get(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  async byId(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    const entity = await this.usersService.findByIdOrFail(id);
    await this.usersService.requireTenantAccess(entity, this.tenantScope.toContext(user));
    return this.usersService.toPublicUser(entity);
  }

  @Post()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  create(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Body() dto: CreateUserAdminDto
  ) {
    return this.usersService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAdminDto
  ) {
    return this.usersService.update(id, dto, this.tenantScope.toContext(user));
  }

  @Patch(':id/activate')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  activate(@CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.setActive(id, true, this.tenantScope.toContext(user));
  }

  @Patch(':id/deactivate')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH')
  deactivate(@CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.setActive(id, false, this.tenantScope.toContext(user));
  }
}
