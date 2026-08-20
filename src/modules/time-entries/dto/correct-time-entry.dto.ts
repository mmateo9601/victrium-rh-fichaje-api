import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CorrectTimeEntryDto {
  @ApiProperty({ example: '2026-08-20' })
  @IsString()
  dia!: string;

  @ApiProperty({ example: '08:30:00' })
  @IsString()
  hora!: string;

  @ApiProperty({ enum: ['ENTRADA', 'SALIDA'] })
  @IsIn(['ENTRADA', 'SALIDA'])
  tipo!: 'ENTRADA' | 'SALIDA';

  @ApiProperty({ example: 'Corrección de hora por incidencia registrada' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo!: string;

  @ApiProperty({ example: 3 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  version!: number;
}
