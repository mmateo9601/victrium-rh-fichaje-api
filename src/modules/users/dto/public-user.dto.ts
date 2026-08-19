import { ApiProperty } from '@nestjs/swagger';

export class PublicUserDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  numero!: string;

  @ApiProperty()
  nombreEmpleado!: string;

  @ApiProperty({ isArray: true, type: String })
  roles!: string[];

  @ApiProperty()
  admin!: boolean;
}
