import { ApiProperty } from '@nestjs/swagger';

import { CalendarDayResponseDto } from './calendar-day-response.dto';

export class CalendarResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nombre!: string;

  @ApiProperty()
  year!: number;

  @ApiProperty()
  minutosMasEntrada!: number;

  @ApiProperty()
  minutosMenosEntrada!: number;

  @ApiProperty()
  active!: boolean;

  @ApiProperty({ isArray: true, type: () => CalendarDayResponseDto })
  days!: CalendarDayResponseDto[];
}
