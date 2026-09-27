// Single API client — holds the prefix, no screen hard-codes /api paths.
// The API is unversioned by decision; the prefix is routing, not version.

export const API_PREFIX = '/api';

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_PREFIX}${normalized}`;
}
