// Register DTO — §4.2 Cadastro de credor

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsContractPassword } from './password.rules';

/** Letters only, accents allowed, per the contract. */
export const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;

export class RegisterDto {
  @ApiProperty({ minLength: 5, maxLength: 20 })
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(5, { message: 'O nome deve ter no mínimo 5 caracteres.' })
  @MaxLength(20, { message: 'O nome deve ter no máximo 20 caracteres.' })
  @Matches(NAME_PATTERN, { message: 'O nome deve conter apenas letras.' })
  name!: string;

  @ApiProperty({ maxLength: 255 })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(255, { message: 'O e-mail deve ter no máximo 255 caracteres.' })
  email!: string;

  @IsContractPassword()
  password!: string;

  @ApiProperty()
  @IsString({ message: 'A confirmação de senha deve ser um texto.' })
  passwordConfirmation!: string;
}
