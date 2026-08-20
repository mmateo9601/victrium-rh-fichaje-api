import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
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
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  list(@CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] }, @Query() query: PaginationQueryDto & { search?: string; role?: string; active?: string }) {
    return this.usersService.list(query, this.tenantScope.toContext(user));
  }

  @Get('me')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  async me(@CurrentUser() user: { sub: number }) {
    const entity = await this.usersService.findByIdOrFail(user.sub);
    return this.usersService.toPublicUser(entity);
  }

  @Get(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  async byId(
    @CurrentUser() user: { sub: number; companyId?: number | null; employeeId?: number | null; roles?: string[] },
    @Param('id', ParseIntPipe) id: number
  ) {
    const entity = await this.usersService.findByIdOrFail(id);
    await this.usersService.requireTenantAccess(entity, this.tenantScope.toContext(user));
    return this.usersService.toPublicUser(entity);
  }
}
