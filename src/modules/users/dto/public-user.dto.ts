import { ApiProperty } from '@nestjs/swagger';

export class PublicUserDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  numero!: string;

  @ApiProperty()
  nombreEmpleado!: string;

  @ApiProperty({ required: false, nullable: true })
  companyId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  employeeId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  companyName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  employeeName?: string | null;

  @ApiProperty({ isArray: true, type: String })
  roles!: string[];

  @ApiProperty()
  active!: boolean;

  @ApiProperty({ required: false, nullable: true })
  lastLoginAt?: string | null;
}
