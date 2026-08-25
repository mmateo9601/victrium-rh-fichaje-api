import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiRoles } from '../../common/auth/api-roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantScopeService } from '../../common/tenant/tenant-scope.service';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto, UpdateAuditLogDto } from './dto/audit-log.dto';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService, private readonly tenantScope: TenantScopeService) {}

  @Get()
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_AUDITOR')
  list(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Query() query: Partial<PaginationQueryDto> & { search?: string; companyId?: number; action?: string }
  ) {
    return this.auditLogsService.list(query, this.tenantScope.toContext(user));
  }

  @Get(':id')
  @ApiRoles('ROLE_SUPER_ADMIN', 'ROLE_AUDITOR')
  get(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseUUIDPipe) id: string) {
    return this.auditLogsService.get(id, this.tenantScope.toContext(user));
  }

  @Post()
  @ApiRoles('ROLE_SUPER_ADMIN')
  create(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Body() dto: CreateAuditLogDto) {
    return this.auditLogsService.create(dto, this.tenantScope.toContext(user));
  }

  @Patch(':id')
  @ApiRoles('ROLE_SUPER_ADMIN')
  update(
    @CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAuditLogDto
  ) {
    return this.auditLogsService.update(id, dto, this.tenantScope.toContext(user));
  }

  @Delete(':id')
  @ApiRoles('ROLE_SUPER_ADMIN')
  delete(@CurrentUser() user: { sub: number; companyId?: number | null; roles?: string[] }, @Param('id', ParseUUIDPipe) id: string) {
    return this.auditLogsService.delete(id, this.tenantScope.toContext(user));
  }
}
