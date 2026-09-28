// Login DTO — §4.4 Login

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ maxLength: 255 })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(255, { message: 'O e-mail deve ter no máximo 255 caracteres.' })
  email!: string;

  @ApiProperty()
  @IsString({ message: 'A senha deve ser um texto.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  // Registration caps passwords at 255 characters, so anything longer can
  // never be valid — reject it before spending argon2 time on it.
  @MaxLength(255, { message: 'Credenciais inválidas.' })
  password!: string;
}
