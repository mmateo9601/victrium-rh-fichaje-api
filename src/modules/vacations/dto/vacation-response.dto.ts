import { ApiProperty } from '@nestjs/swagger';

import { VacationStatus } from '../../../database/entities/vacation-status.enum';

export class VacationResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ format: 'date' })
  inicio!: string;

  @ApiProperty({ format: 'date' })
  fin!: string;

  @ApiProperty()
  consumidas!: boolean;

  @ApiProperty({ enum: VacationStatus })
  estado!: VacationStatus;

  @ApiProperty()
  aprobado!: boolean;

  @ApiProperty({ required: false, nullable: true })
  companyId!: number | null;

  @ApiProperty({ required: false, nullable: true })
  companyName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  employeeId!: number | null;

  @ApiProperty({ required: false, nullable: true })
  employeeNumero!: string | null;

  @ApiProperty({ required: false, nullable: true })
  employeeNombre!: string | null;

  @ApiProperty({ required: false, nullable: true })
  employeeEmail!: string | null;

  @ApiProperty({ required: false, nullable: true })
  employeeDni!: string | null;
}
