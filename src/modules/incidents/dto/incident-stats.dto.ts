import { ApiProperty } from '@nestjs/swagger';

export class IncidentMonthlyStatDto {
  @ApiProperty()
  month!: string;

  @ApiProperty()
  total!: number;
}

export class IncidentTopSummaryDto {
  @ApiProperty()
  resumen!: string;

  @ApiProperty()
  total!: number;
}

export class IncidentUserStatDto {
  @ApiProperty({ required: false, nullable: true })
  employeeId!: number | null;

  @ApiProperty({ required: false, nullable: true })
  employeeNumero!: string | null;

  @ApiProperty({ required: false, nullable: true })
  employeeNombre!: string | null;

  @ApiProperty()
  total!: number;
}
