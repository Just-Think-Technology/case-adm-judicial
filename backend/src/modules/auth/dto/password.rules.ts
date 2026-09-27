// Shared password rules — one home for the contract's password policy

import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** At least one uppercase letter. */
export const UPPERCASE_PATTERN = /[A-Z]/;
/** At least one lowercase letter. */
export const LOWERCASE_PATTERN = /[a-z]/;
/** At least one digit. */
export const DIGIT_PATTERN = /[0-9]/;
/** At least one of the contract's special characters. */
export const SPECIAL_PATTERN = /[@$!%*?&]/;

/**
 * Applies the contract's password rules (§4.2): 8+ characters with upper,
 * lower, digit and special. Every message is PT-BR and names the missing rule.
 */
export function IsContractPassword() {
  return applyDecorators(
    IsString({ message: 'A senha deve ser um texto.' }),
    MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' }),
    MaxLength(255, { message: 'A senha deve ter no máximo 255 caracteres.' }),
    Matches(UPPERCASE_PATTERN, { message: 'A senha deve conter ao menos uma letra maiúscula.' }),
    Matches(LOWERCASE_PATTERN, { message: 'A senha deve conter ao menos uma letra minúscula.' }),
    Matches(DIGIT_PATTERN, { message: 'A senha deve conter ao menos um número.' }),
    Matches(SPECIAL_PATTERN, {
      message: 'A senha deve conter ao menos um caractere especial (@ $ ! % * ? &).',
    }),
    ApiProperty({ minLength: 8, maxLength: 255 }),
  );
}
