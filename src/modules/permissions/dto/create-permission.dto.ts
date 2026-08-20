import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ format: 'date' })
  @IsDateString()
  dia!: string;

  @ApiProperty({ pattern: '^\\d{2}:\\d{2}(:\\d{2})?$' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  horaInicio!: string;

  @ApiProperty({ pattern: '^\\d{2}:\\d{2}(:\\d{2})?$' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  horaFin!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  descripcion!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  employeeId?: number;
}
