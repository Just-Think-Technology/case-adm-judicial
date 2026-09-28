// Update profile DTO — §4.6 account menu, name and e-mail card

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { NAME_PATTERN } from './register.dto';

/**
 * Both fields optional: sending nothing is a valid no-op, and each provided
 * field follows the registration rules (single home for the policy).
 */
export class UpdateProfileDto {
  @ApiProperty({ required: false, minLength: 5, maxLength: 20 })
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(5, { message: 'O nome deve ter no mínimo 5 caracteres.' })
  @MaxLength(20, { message: 'O nome deve ter no máximo 20 caracteres.' })
  @Matches(NAME_PATTERN, { message: 'O nome deve conter apenas letras.' })
  name?: string;

  @ApiProperty({ required: false, maxLength: 255 })
  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(255, { message: 'O e-mail deve ter no máximo 255 caracteres.' })
  email?: string;
}
