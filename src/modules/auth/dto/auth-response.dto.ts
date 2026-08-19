import { ApiProperty } from '@nestjs/swagger';

import { PublicUserDto } from '../../users/dto/public-user.dto';

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  tokenType = 'Bearer' as const;

  @ApiProperty({ type: PublicUserDto })
  user!: PublicUserDto;
}
