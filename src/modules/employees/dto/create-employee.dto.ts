import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

import { RoleName } from '../../../database/entities/role-name.enum';

export class CreateEmployeeDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  companyId?: number;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  numero!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  nombreEmpleado!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  dni!: string;

  @ApiProperty({ isArray: true, enum: RoleName })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(RoleName, { each: true })
  roles!: RoleName[];

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  diasVacaciones?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  horasGeneradas?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  working?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  enVacaciones?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  deBaja?: boolean;
}
