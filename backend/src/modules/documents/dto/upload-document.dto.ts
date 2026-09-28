// Upload document DTO — one form per file, validated programmatically
//
// Multipart bodies skip the global ValidationPipe, so the service binds the
// text fields into this DTO and runs validate() itself: same decorators, same
// PT-BR messages, same 400 shape.

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ example: 'Habilitação de crédito' })
  @IsString({ message: 'O tipo de documento deve ser um texto.' })
  @IsNotEmpty({ message: 'O tipo de documento é obrigatório.' })
  type!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'A especificação do tipo deve ser um texto.' })
  @MaxLength(255, { message: 'A especificação do tipo deve ter no máximo 255 caracteres.' })
  customType?: string;

  @ApiProperty({ maxLength: 255 })
  @IsString({ message: 'O nome do documento deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome do documento é obrigatório.' })
  @MaxLength(255, { message: 'O nome do documento deve ter no máximo 255 caracteres.' })
  name!: string;

  @ApiProperty({ required: false, maxLength: 1000 })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(1000, { message: 'A descrição deve ter no máximo 1000 caracteres.' })
  description?: string;
}
