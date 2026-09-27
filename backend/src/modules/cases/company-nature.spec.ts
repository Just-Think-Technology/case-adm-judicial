// Company nature — labels and slugs into the closed enum

import { InvalidNatureError, normalizeNature } from './company-nature';

describe('normalizeNature', () => {
  it('accepts the PT-BR labels', () => {
    expect(normalizeNature('Recuperação Judicial')).toBe('RECUPERACAO_JUDICIAL');
    expect(normalizeNature('Falência')).toBe('FALENCIA');
  });

  it('accepts URL slugs and sloppy casing', () => {
    expect(normalizeNature('recuperacao-judicial')).toBe('RECUPERACAO_JUDICIAL');
    expect(normalizeNature('FALENCIA')).toBe('FALENCIA');
    expect(normalizeNature('  Recuperação judicial  ')).toBe('RECUPERACAO_JUDICIAL');
  });

  it('rejects anything outside the closed set', () => {
    expect(() => normalizeNature('Concordata')).toThrow(InvalidNatureError);
    expect(() => normalizeNature('')).toThrow(InvalidNatureError);
  });
});
