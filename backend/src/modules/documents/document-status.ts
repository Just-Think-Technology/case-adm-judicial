// Document status — labels and tolerant input into the closed enum

import type { DocumentStatus } from '@prisma/client';

/**
 * Type-only Prisma import: the values are the enum's own string literals, so
 * this seam never loads the Prisma runtime and stays unit-testable (same
 * pattern as company-nature and document-type).
 */
const BY_NORMALIZED: Record<string, DocumentStatus> = {
  emanalise: 'EM_ANALISE' as DocumentStatus,
  deferido: 'DEFERIDO' as DocumentStatus,
  indeferido: 'INDEFERIDO' as DocumentStatus,
};

/** The single home for the three status labels shown to the user. */
export const STATUS_LABELS = {
  EM_ANALISE: 'Em análise',
  DEFERIDO: 'Deferido',
  INDEFERIDO: 'Indeferido',
} as const;

/** Anything outside the trio is rejected, never stored. */
export class InvalidDocumentStatusError extends Error {
  constructor() {
    super('Status inválido. Escolha Em análise, Deferido ou Indeferido.');
    this.name = 'InvalidDocumentStatusError';
  }
}

/**
 * Maps a user-supplied status to the closed enum. Any state can go to any
 * other state — there is no terminal state and no irreversible transition.
 *
 * @param input - The raw status from the request
 */
export function normalizeDocumentStatus(input: string): DocumentStatus {
  const key = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '');

  const status = BY_NORMALIZED[key];
  if (!status) {
    throw new InvalidDocumentStatusError();
  }

  return status;
}
