import { ApiProperty } from '@nestjs/swagger';

export class IncidentResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  descripcion!: string;

  @ApiProperty()
  resumen!: string;

  @ApiProperty({ format: 'date' })
  dia!: string;

  @ApiProperty()
  resuelta!: boolean;

  @ApiProperty({ required: false, nullable: true })
  explicacion?: string | null;

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
