import { ApiProperty } from '@nestjs/swagger';

export class TimeEntryBreakDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  startedAt!: string;

  @ApiProperty({ required: false, nullable: true })
  endedAt!: string | null;

  @ApiProperty()
  seconds!: number;
}
