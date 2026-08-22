import { ApiProperty } from '@nestjs/swagger';

import { PermissionStatus } from '../../../database/entities/permission-status.enum';

export class PermissionResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ format: 'date' })
  dia!: string;

  @ApiProperty()
  horaInicio!: string;

  @ApiProperty()
  horaFin!: string;

  @ApiProperty()
  descripcion!: string;

  @ApiProperty({ enum: PermissionStatus })
  estado!: PermissionStatus;

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
}
