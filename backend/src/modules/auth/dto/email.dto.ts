// E-mail DTO — resend verification (§4.3) and forgot password (§4.5)

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class EmailDto {
  @ApiProperty({ maxLength: 255 })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(255, { message: 'O e-mail deve ter no máximo 255 caracteres.' })
  email!: string;
}
