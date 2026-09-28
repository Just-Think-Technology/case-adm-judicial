import { describe, expect, it } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('renders an ISO timestamp as a pt-BR date', () => {
    expect(formatDate('2026-09-20T12:00:00.000Z')).toMatch(/20\/09\/2026/);
  });

  it('returns the raw value when it is not a date', () => {
    expect(formatDate('Não informado')).toBe('Não informado');
    expect(formatDate('')).toBe('');
  });
});
