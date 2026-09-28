// Pagination — page query into skip/take, one page size for the product

/** The only page size in the system, shared by every paginated listing. */
export const PAGE_SIZE = 10;

/** Thrown when the page is not a positive integer. */
export class InvalidPageError extends Error {
  constructor() {
    super('Página inválida.');
    this.name = 'InvalidPageError';
  }
}

/**
 * Parses the page query: absent means the first page, anything that is not a
 * positive integer is rejected instead of silently clamped.
 */
export function parsePage(input: string | undefined): { page: number; take: number; skip: number } {
  if (input === undefined || input === '') {
    return { page: 1, take: PAGE_SIZE, skip: 0 };
  }

  const page = Number(input);
  if (!Number.isInteger(page) || page < 1) {
    throw new InvalidPageError();
  }

  return { page, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE };
}

/** Total pages for a total row count and the shared page size. */
export function totalPages(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}
