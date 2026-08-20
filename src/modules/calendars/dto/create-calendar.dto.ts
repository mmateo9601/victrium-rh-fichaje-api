import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

import { CalendarDayDto } from './calendar-day.dto';

export class CreateCalendarDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  nombre!: string;

  @ApiProperty()
  @IsInt()
  year!: number;

  @ApiProperty()
  @IsInt()
  minutosMasEntrada!: number;

  @ApiProperty()
  @IsInt()
  minutosMenosEntrada!: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ isArray: true, type: () => CalendarDayDto })
  @IsArray()
  @ArrayMinSize(1)
  days!: CalendarDayDto[];
}
