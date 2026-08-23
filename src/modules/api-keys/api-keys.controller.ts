import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeysService } from './api-keys.service';

@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'api-keys', version: '1' })
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiRoles('ROLE_SUPER_ADMIN')
  create(
    @CurrentUser() user: { sub: number; numero?: string; roles?: string[]; companyId?: number | null; employeeId?: number | null },
    @Body() dto: CreateApiKeyDto
  ) {
    return this.apiKeysService.create(dto, user);
  }

  @Get()
  @ApiRoles('ROLE_SUPER_ADMIN')
  list(
    @CurrentUser() user: { sub: number; numero?: string; roles?: string[]; companyId?: number | null; employeeId?: number | null },
    @Query() query: PaginationQueryDto & { search?: string; active?: string | boolean; sort?: string; order?: string }
  ) {
    return this.apiKeysService.list(query, user);
  }

  @Get('users/:userId')
  @ApiRoles('ROLE_SUPER_ADMIN')
  listByUser(
    @CurrentUser() user: { sub: number; numero?: string; roles?: string[]; companyId?: number | null; employeeId?: number | null },
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: PaginationQueryDto & { search?: string; active?: string | boolean; sort?: string; order?: string }
  ) {
    return this.apiKeysService.listByUser(userId, query, user);
  }

  @Get(':id')
  @ApiRoles('ROLE_SUPER_ADMIN')
  getById(
    @CurrentUser() user: { sub: number; numero?: string; roles?: string[]; companyId?: number | null; employeeId?: number | null },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.apiKeysService.getById(id, user);
  }

  @Patch(':id/deactivate')
  @ApiRoles('ROLE_SUPER_ADMIN')
  deactivate(
    @CurrentUser() user: { sub: number; numero?: string; roles?: string[]; companyId?: number | null; employeeId?: number | null },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.apiKeysService.deactivate(id, user);
  }

  @Patch(':id/activate')
  @ApiRoles('ROLE_SUPER_ADMIN')
  activate(
    @CurrentUser() user: { sub: number; numero?: string; roles?: string[]; companyId?: number | null; employeeId?: number | null },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.apiKeysService.activate(id, user);
  }

  @Delete(':id')
  @ApiRoles('ROLE_SUPER_ADMIN')
  remove(
    @CurrentUser() user: { sub: number; numero?: string; roles?: string[]; companyId?: number | null; employeeId?: number | null },
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.apiKeysService.remove(id, user);
  }
}
