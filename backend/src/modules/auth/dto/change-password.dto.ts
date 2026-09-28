// Change password DTO — §4.6 account menu, password card

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsContractPassword } from './password.rules';

/**
 * The current password proves presence; the contract rules apply to the new
 * one. Equality checks (confirmation, different-from-current) live in the
 * service, next to the hash they compare against.
 */
export class ChangePasswordDto {
  @ApiProperty()
  @IsString({ message: 'A senha atual deve ser um texto.' })
  currentPassword!: string;

  @IsContractPassword()
  password!: string;

  @ApiProperty()
  @IsString({ message: 'A confirmação de senha deve ser um texto.' })
  passwordConfirmation!: string;
}
