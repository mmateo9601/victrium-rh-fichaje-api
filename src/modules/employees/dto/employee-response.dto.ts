import { ApiProperty } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  numero!: string;

  @ApiProperty()
  nombreEmpleado!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  dni!: string;

  @ApiProperty({ required: false, nullable: true })
  companyId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  companyName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  userId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  diasVacaciones?: number | null;

  @ApiProperty({ required: false, nullable: true })
  horasGeneradas?: number | null;

  @ApiProperty({ required: false, nullable: true })
  working?: boolean | null;

  @ApiProperty({ required: false, nullable: true })
  enVacaciones?: boolean | null;

  @ApiProperty({ required: false, nullable: true })
  deBaja?: boolean | null;

  @ApiProperty({ required: false, nullable: true })
  ultimoFichaje?: string | null;

  @ApiProperty({ isArray: true, type: String })
  roles!: string[];

  @ApiProperty()
  active!: boolean;
}
