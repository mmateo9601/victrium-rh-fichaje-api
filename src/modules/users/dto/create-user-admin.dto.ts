import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { RoleName } from '../../../database/entities/role-name.enum';

export class CreateUserAdminDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

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

  @ApiProperty()
  @IsString()
  @MinLength(12)
  @MaxLength(255)
  password!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  companyId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  employeeId?: number | null;

  @ApiProperty({ isArray: true, enum: RoleName })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(RoleName, { each: true })
  roles!: RoleName[];

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
