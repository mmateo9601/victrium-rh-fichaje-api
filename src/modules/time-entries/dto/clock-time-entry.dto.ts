import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClockTimeEntryDto {
  @ApiPropertyOptional({ example: 'web' })
  @IsOptional()
  @IsString()
  origen?: string;
}
