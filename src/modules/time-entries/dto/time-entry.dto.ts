import { ApiProperty } from '@nestjs/swagger';

export class TimeEntryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  hora!: string;

  @ApiProperty()
  dia!: string;

  @ApiProperty()
  tipo!: 'ENTRADA' | 'SALIDA';

  @ApiProperty()
  origen!: string;

  @ApiProperty()
  usuarioId!: number;

  @ApiProperty()
  usuarioNumero!: string;

  @ApiProperty()
  usuarioNombre!: string;
}
