import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Mobile integration key' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsInt()
  @Min(1)
  userId!: number;

  @ApiPropertyOptional({ example: 30, description: 'Days until expiration' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInDays?: number;
}
