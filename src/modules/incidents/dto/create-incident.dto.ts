import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateIncidentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  descripcion!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  resumen!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  dia!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  explicacion?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  employeeId?: number;
}
