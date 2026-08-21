import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class CreatePlanningPeriodDto {
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
  @Length(10, 10)
  startDate!: string;

  @ApiProperty()
  @IsString()
  @Length(10, 10)
  endDate!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class UpdatePlanningPeriodDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsInt()
  companyId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(10, 10)
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(10, 10)
  endDate?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export type PlanningPeriodDto = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  name: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED';
  version: number;
  publishedAt: string | null;
  publishedById: number | null;
  publishedByNumero: string | null;
  publishedByNombre: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanningPeriodAuditDto = {
  id: number;
  planningPeriodId: number;
  planningPeriodName: string;
  action: 'CREATE' | 'UPDATE' | 'PUBLISH' | 'UNPUBLISH';
  previousStatus: string | null;
  nextStatus: string;
  previousVersion: number | null;
  nextVersion: number;
  previousSnapshot: Record<string, unknown> | null;
  nextSnapshot: Record<string, unknown>;
  reason: string | null;
  changedById: number | null;
  changedByNumero: string | null;
  changedByNombre: string | null;
  createdAt: string;
};
