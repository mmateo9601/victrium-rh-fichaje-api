import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, Matches } from 'class-validator';

export class CalendarDayDto {
  @ApiProperty({ format: 'date' })
  @IsDateString()
  dia!: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaInicio must use HH:mm format' })
  horaInicio!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaFin must use HH:mm format' })
  horaFin!: string;
}
