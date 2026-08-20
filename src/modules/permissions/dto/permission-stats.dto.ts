import { ApiProperty } from '@nestjs/swagger';

export class PermissionMonthlyStatDto {
  @ApiProperty()
  month!: string;

  @ApiProperty()
  totalMinutes!: number;
}

export class PermissionUserStatDto {
  @ApiProperty({ required: false, nullable: true })
  employeeId!: number | null;

  @ApiProperty({ required: false, nullable: true })
  employeeNumero!: string | null;

  @ApiProperty({ required: false, nullable: true })
  employeeNombre!: string | null;

  @ApiProperty()
  totalMinutes!: number;
}
