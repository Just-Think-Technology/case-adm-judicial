// Reset-password DTO — §4.5, same password rules as registration

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { IsContractPassword } from './password.rules';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString({ message: 'O token deve ser um texto.' })
  @IsNotEmpty({ message: 'O token é obrigatório.' })
  token!: string;

  @IsContractPassword()
  password!: string;

  @ApiProperty()
  @IsString({ message: 'A confirmação de senha deve ser um texto.' })
  passwordConfirmation!: string;
}
