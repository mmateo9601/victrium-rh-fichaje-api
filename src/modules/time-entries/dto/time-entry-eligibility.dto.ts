import { ApiProperty } from '@nestjs/swagger';

export type TimeEntryEligibilityReason =
  | 'ALLOWED'
  | 'TOO_EARLY'
  | 'OUT_OF_WINDOW'
  | 'NO_SCHEDULE'
  | 'EMPLOYEE_INACTIVE'
  | 'ABSENCE_BLOCKS_CLOCK_IN'
  | 'SESSION_ACTIVE'
  | 'SESSION_COMPLETED'
  | 'NO_WORK_LOCATION';

export class TimeEntryEligibilityDto {
  @ApiProperty()
  canStart!: boolean;

  @ApiProperty({ enum: ['ALLOWED', 'TOO_EARLY', 'OUT_OF_WINDOW', 'NO_SCHEDULE', 'EMPLOYEE_INACTIVE', 'ABSENCE_BLOCKS_CLOCK_IN', 'SESSION_ACTIVE', 'SESSION_COMPLETED', 'NO_WORK_LOCATION'] })
  reason!: TimeEntryEligibilityReason;

  @ApiProperty({ required: false, nullable: true })
  message!: string | null;

  @ApiProperty()
  evaluatedAt!: string;

  @ApiProperty({ required: false, nullable: true })
  allowedFrom!: string | null;

  @ApiProperty({ required: false, nullable: true })
  allowedUntil!: string | null;

  @ApiProperty({ required: false, nullable: true })
  scheduledStart!: string | null;

  @ApiProperty({ required: false, nullable: true })
  scheduledEnd!: string | null;

  @ApiProperty({ required: false, nullable: true })
  earlyClockInMinutes!: number | null;

  @ApiProperty({ required: false, nullable: true })
  companyId!: number | null;

  @ApiProperty({ required: false, nullable: true })
  companyName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  workLocationId!: number | null;

  @ApiProperty({ required: false, nullable: true })
  workLocationName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  workLocationCode!: string | null;

  @ApiProperty({ required: false, nullable: true })
  shiftId!: number | null;

  @ApiProperty({ required: false, nullable: true })
  shiftName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  shiftCode!: string | null;
}
