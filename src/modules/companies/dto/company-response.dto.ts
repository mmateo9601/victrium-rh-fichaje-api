import { ApiProperty } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ required: false, nullable: true })
  timezone!: string | null;

  @ApiProperty({ required: false, nullable: true })
  workPolicy!: Record<string, unknown> | null;

  @ApiProperty()
  active!: boolean;
}
