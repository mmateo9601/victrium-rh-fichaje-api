import { ApiProperty } from '@nestjs/swagger';

export class CalendarDayResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ format: 'date' })
  dia!: string;

  @ApiProperty({ example: '09:00' })
  horaInicio!: string;

  @ApiProperty({ example: '17:00' })
  horaFin!: string;
}
