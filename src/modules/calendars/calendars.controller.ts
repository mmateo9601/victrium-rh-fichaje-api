import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/auth/jwt.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CalendarsService } from './calendars.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

@ApiTags('calendars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'calendars', version: '1' })
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

  @Get()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  list(@Query() query: PaginationQueryDto & { search?: string; active?: string; year?: string }) {
    return this.calendarsService.list(query);
  }

  @Get('list/dto')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  listDto(@Query() query: PaginationQueryDto & { search?: string; active?: string; year?: string }) {
    return this.calendarsService.list(query);
  }

  @Post()
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  create(@Body() dto: CreateCalendarDto) {
    return this.calendarsService.create(dto);
  }

  @Get(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  byId(@Param('id', ParseIntPipe) id: number) {
    return this.calendarsService.getVisibleCalendar(id);
  }

  @Patch(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCalendarDto) {
    return this.calendarsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ROLE_ADMIN', 'ROLE_RRHH')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.calendarsService.delete(id);
  }
}
