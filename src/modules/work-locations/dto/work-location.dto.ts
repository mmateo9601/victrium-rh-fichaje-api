import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class CreateWorkLocationDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  companyId?: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  timezone?: string | null;
}

export class UpdateWorkLocationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  province?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  timezone?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateEmployeeLocationAssignmentDto {
  @ApiProperty()
  @IsInt()
  employeeId!: number;

  @ApiProperty()
  @IsInt()
  workLocationId!: number;

  @ApiProperty()
  @IsString()
  validFrom!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  validTo?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  primary?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateEmployeeLocationAssignmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  employeeId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  workLocationId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  validFrom?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  validTo?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  primary?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export type WorkLocationDto = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  timezone: string | null;
  active: boolean;
  calendarId: number | null;
  calendarName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeLocationAssignmentDto = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  workLocationId: number;
  workLocationName: string;
  workLocationCode: string;
  validFrom: string;
  validTo: string | null;
  primary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
