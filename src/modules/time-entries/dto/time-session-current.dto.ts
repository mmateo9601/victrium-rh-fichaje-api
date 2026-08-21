import { ApiProperty } from '@nestjs/swagger';

import { TimeEntryBreakDto } from './time-entry-break.dto';

export class TimeSessionCurrentDto {
  @ApiProperty({ enum: ['NOT_STARTED', 'WORKING', 'PAUSED', 'COMPLETED'] })
  state!: 'NOT_STARTED' | 'WORKING' | 'PAUSED' | 'COMPLETED';

  @ApiProperty({ required: false, nullable: true })
  sessionId!: number | null;

  @ApiProperty({ required: false, nullable: true })
  startedAt!: string | null;

  @ApiProperty({ required: false, nullable: true })
  finishedAt!: string | null;

  @ApiProperty({ required: false, nullable: true })
  activeBreak!: TimeEntryBreakDto | null;

  @ApiProperty()
  workedSeconds!: number;

  @ApiProperty()
  breakSeconds!: number;

  @ApiProperty()
  usuarioId!: number;

  @ApiProperty()
  usuarioNumero!: string;

  @ApiProperty()
  usuarioNombre!: string;

  @ApiProperty({ required: false, nullable: true })
  companyId!: number | null;

  @ApiProperty({ required: false, nullable: true })
  companyName!: string | null;
}
