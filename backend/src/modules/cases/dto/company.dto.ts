// Company DTO — §4.8 Empresas (casos), one shape for create and full update

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

/** Letters, digits, dot, hyphen and slash — the only process-number charset. */
export const PROCESS_NUMBER_PATTERN = /^[A-Za-z0-9.\-/]+$/;

/**
 * The contract's form asks for every field and the edit screen is the same
 * form pre-filled, so create and PUT share this DTO: a full replacement, not
 * a patch.
 */
export class CompanyDto {
  @ApiProperty({ maxLength: 300 })
  @IsString({ message: 'O nome da empresa deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório.' })
  @MaxLength(300, { message: 'O nome da empresa deve ter no máximo 300 caracteres.' })
  name!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString({ message: 'O administrador judicial deve ser um texto.' })
  @IsNotEmpty({ message: 'O administrador judicial é obrigatório.' })
  @MaxLength(300, { message: 'O administrador judicial deve ter no máximo 300 caracteres.' })
  judicialAdmin!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString({ message: 'O juiz de direito deve ser um texto.' })
  @IsNotEmpty({ message: 'O juiz de direito é obrigatório.' })
  @MaxLength(300, { message: 'O juiz de direito deve ter no máximo 300 caracteres.' })
  judge!: string;

  @ApiProperty({ example: 'Recuperação Judicial' })
  @IsString({ message: 'A natureza deve ser um texto.' })
  @IsNotEmpty({ message: 'A natureza é obrigatória.' })
  nature!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString({ message: 'O número do processo deve ser um texto.' })
  @IsNotEmpty({ message: 'O número do processo é obrigatório.' })
  @MaxLength(50, { message: 'O número do processo deve ter no máximo 50 caracteres.' })
  @Matches(PROCESS_NUMBER_PATTERN, {
    message: 'O número do processo aceita apenas letras, números, ponto, hífen e barra.',
  })
  processNumber!: string;

  @ApiProperty({ example: '2024-03-15' })
  @IsDateString({}, { message: 'O protocolo deve ser uma data válida.' })
  protocolDate!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString({ message: 'O autor deve ser um texto.' })
  @IsNotEmpty({ message: 'O autor é obrigatório.' })
  @MaxLength(300, { message: 'O autor deve ter no máximo 300 caracteres.' })
  author!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString({ message: 'A comarca/escrivania deve ser um texto.' })
  @IsNotEmpty({ message: 'A comarca/escrivania é obrigatória.' })
  @MaxLength(300, { message: 'A comarca/escrivania deve ter no máximo 300 caracteres.' })
  comarca!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString({ message: 'As observações devem ser um texto.' })
  @IsNotEmpty({ message: 'As observações são obrigatórias.' })
  @MaxLength(300, { message: 'As observações devem ter no máximo 300 caracteres.' })
  observations!: string;
}
