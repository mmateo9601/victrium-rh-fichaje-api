import { ApiProperty } from '@nestjs/swagger';

export class TimeEntryAuditDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  timeEntryId!: number;

  @ApiProperty()
  previousDia!: string;

  @ApiProperty()
  previousHora!: string;

  @ApiProperty({ enum: ['ENTRADA', 'SALIDA'] })
  previousTipo!: 'ENTRADA' | 'SALIDA';

  @ApiProperty()
  newDia!: string;

  @ApiProperty()
  newHora!: string;

  @ApiProperty({ enum: ['ENTRADA', 'SALIDA'] })
  newTipo!: 'ENTRADA' | 'SALIDA';

  @ApiProperty()
  previousVersion!: number;

  @ApiProperty()
  newVersion!: number;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  correctedById!: number;

  @ApiProperty()
  correctedByNumero!: string;

  @ApiProperty()
  correctedByNombre!: string;
}
