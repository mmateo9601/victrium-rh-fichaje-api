import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CalendarDayEntity } from '../../database/entities/calendar-day.entity';
import { CalendarEntity } from '../../database/entities/calendar.entity';
import { CalendarsController } from './calendars.controller';
import { CalendarsService } from './calendars.service';

@Module({
  imports: [TypeOrmModule.forFeature([CalendarEntity, CalendarDayEntity])],
  controllers: [CalendarsController],
  providers: [CalendarsService]
})
export class CalendarsModule {}
