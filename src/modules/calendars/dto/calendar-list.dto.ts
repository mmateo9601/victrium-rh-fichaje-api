import { ApiProperty } from '@nestjs/swagger';

export class CalendarListDto {
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

  @ApiProperty()
  daysCount!: number;
}
