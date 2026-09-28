// Document type — PT-BR labels and slugs into the closed enum

import type { DocumentType } from '@prisma/client';

/**
 * Type-only Prisma import on purpose: the values are the enum's own string
 * literals, so this seam never loads the Prisma runtime and stays
 * unit-testable under the repo's jest setup (same pattern as company-nature).
 */
const BY_NORMALIZED: Record<string, DocumentType> = {
  habilitacaodecredito: 'HABILITACAO_CREDITO' as DocumentType,
  divergenciadecredito: 'DIVERGENCIA_CREDITO' as DocumentType,
  habilitacaoacg: 'HABILITACAO_ACG' as DocumentType,
  outros: 'OUTROS' as DocumentType,
};

/** The upload form sends UI labels; the database stores the enum. */
export class InvalidDocumentTypeError extends Error {
  constructor() {
    super(
      'Tipo de documento inválido. Escolha Habilitação de crédito, Divergência de crédito, Habilitação ACG ou Outros.',
    );
    this.name = 'InvalidDocumentTypeError';
  }
}

/**
 * Maps a user-supplied document type to the closed enum. Accents, case,
 * spaces and hyphens are ignored; anything else is rejected, never stored.
 *
 * @param input - The raw type from the upload form
 */
export function normalizeDocumentType(input: unknown): DocumentType {
  if (typeof input !== 'string') {
    throw new InvalidDocumentTypeError();
  }

  const key = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '');

  const type = BY_NORMALIZED[key];
  if (!type) {
    throw new InvalidDocumentTypeError();
  }

  return type;
}

/** UI labels keyed by the stored enum — the single home for both directions. */
export const DOCUMENT_TYPE_LABELS = {
  HABILITACAO_CREDITO: 'Habilitação de crédito',
  DIVERGENCIA_CREDITO: 'Divergência de crédito',
  HABILITACAO_ACG: 'Habilitação ACG',
  OUTROS: 'Outros',
} as const;
