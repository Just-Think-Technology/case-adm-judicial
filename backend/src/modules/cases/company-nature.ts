// Company nature — PT-BR labels and URL slugs into the closed enum
//
// Nest-free on purpose: translating this into an HTTP error is the service's
// job, so the seam stays unit-testable under the repo's jest setup.

import type { CaseNature } from '@prisma/client';

/**
 * The import is type-only on purpose: the values below are the enum's own
 * string literals, so this seam never loads the Prisma runtime and stays
 * unit-testable under the repo's jest setup.
 */
const BY_NORMALIZED: Record<string, CaseNature> = {
  recuperacaojudicial: 'RECUPERACAO_JUDICIAL' as CaseNature,
  falencia: 'FALENCIA' as CaseNature,
};

/** The API accepts labels, slugs and sloppy casing — the database stores the enum. */
export class InvalidNatureError extends Error {
  constructor() {
    super('Natureza inválida. Escolha Recuperação Judicial ou Falência.');
    this.name = 'InvalidNatureError';
  }
}

/** The single home for the two nature labels shown to the user. */
export const NATURE_LABELS = {
  RECUPERACAO_JUDICIAL: 'Recuperação Judicial',
  FALENCIA: 'Falência',
} as const;

/**
 * Maps a user-supplied nature to the closed enum. Accents, case, spaces and
 * hyphens are all ignored, so "Recuperação Judicial", "recuperacao-judicial"
 * and "FALENCIA" land on the same value; anything else is rejected, never
 * stored.
 *
 * @param input - The raw nature from the request body or query string
 */
export function normalizeNature(input: unknown): CaseNature {
  if (typeof input !== 'string') {
    throw new InvalidNatureError();
  }

  const key = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '');

  const nature = BY_NORMALIZED[key];
  if (!nature) {
    throw new InvalidNatureError();
  }

  return nature;
}
