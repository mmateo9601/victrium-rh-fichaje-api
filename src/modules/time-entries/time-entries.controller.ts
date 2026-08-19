import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { ClockTimeEntryDto } from './dto/clock-time-entry.dto';
import { TimeEntriesService } from './time-entries.service';

@ApiTags('time-entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'time-entries', version: '1' })
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post('clock')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  clock(@CurrentUser() user: { sub: number }, @Body() dto: ClockTimeEntryDto) {
    return this.timeEntriesService.clock(user.sub, dto);
  }

  @Get()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  list(@Query() query: PaginationQueryDto & { numeroUsuario?: string; tipo?: string; from?: string; to?: string }) {
    return this.timeEntriesService.list(query);
  }

  @Get('me')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_USER')
  mine(@CurrentUser() user: { sub: number }, @Query() query: PaginationQueryDto) {
    return this.timeEntriesService.findMine(user.sub, query);
  }

  @Get(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  byId(@Param('id', ParseIntPipe) id: number) {
    return this.timeEntriesService.findById(id);
  }
}
