import { ApiProperty } from '@nestjs/swagger';

export class PublicUserDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  numero!: string;

  @ApiProperty()
  nombreEmpleado!: string;

  @ApiProperty({ required: false, nullable: true })
  companyId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  employeeId?: number | null;

  @ApiProperty({ isArray: true, type: String })
  roles!: string[];

  @ApiProperty()
  admin!: boolean;
}
