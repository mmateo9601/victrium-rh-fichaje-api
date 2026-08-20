import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateVacationDto {
  @ApiProperty({ format: 'date' })
  @IsDateString()
  inicio!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  fin!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  employeeId?: number;
}
