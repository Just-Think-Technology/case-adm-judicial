// Single API client — holds the prefix, no screen hard-codes /api paths
// per .agents/decisions/api-versioning.md

export const API_PREFIX = '/api/v1';

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_PREFIX}${normalized}`;
}
