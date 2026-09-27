// Document access — who may read a stored document, as a pure function
//
// The single home for the read matrix of
// .agents/decisions/document-visibility.md: the list query, the delivery
// action and the tests all consume this instead of re-deriving it.

export type DocumentVisibilityValue = 'PUBLICO' | 'PRIVADO';

export interface ReadableDocument {
  visibility: DocumentVisibilityValue;
  ownerId: string;
  ownerRole: string;
}

export interface DocumentViewer {
  id: string;
  role: string;
}

/** The single home for the two visibility seals shown to the user. */
export const VISIBILITY_LABELS = {
  PUBLICO: 'Público',
  PRIVADO: 'Privado',
} as const;

const VISIBILITY_BY_NORMALIZED: Record<string, DocumentVisibilityValue> = {
  publico: 'PUBLICO',
  privado: 'PRIVADO',
};

/** Anything outside the pair is rejected, never stored. */
export class InvalidVisibilityError extends Error {
  constructor() {
    super('Visibilidade inválida. Escolha público ou privado.');
    this.name = 'InvalidVisibilityError';
  }
}

/**
 * Maps a user-supplied visibility to the closed pair, tolerating accents,
 * case and surrounding whitespace.
 *
 * @param input - The raw visibility from the request
 */
export function normalizeVisibility(input: string): DocumentVisibilityValue {
  const key = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '');

  const visibility = VISIBILITY_BY_NORMALIZED[key];
  if (!visibility) {
    throw new InvalidVisibilityError();
  }

  return visibility;
}

/**
 * Whether the viewer may read the document. Unknown means hidden: a document
 * that is not visible answers 404, never 403, so its existence never leaks.
 *
 * @param document - Visibility, owner and owner role of the stored document
 * @param viewer - The authenticated caller, or undefined for a visitor
 */
export function canReadDocument(
  document: ReadableDocument,
  viewer: DocumentViewer | undefined,
): boolean {
  if (document.visibility === 'PUBLICO') {
    return true;
  }

  if (!viewer) {
    return false;
  }

  if (viewer.role === 'ADMIN') {
    return true;
  }

  if (document.ownerId === viewer.id) {
    return true;
  }

  return document.ownerRole === 'ADMIN';
}
