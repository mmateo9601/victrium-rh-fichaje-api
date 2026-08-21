import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ description: 'Número de empleado o email' })
  @IsString()
  numero!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;
}
