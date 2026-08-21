import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  workPolicy?: Record<string, unknown> | null;
}
