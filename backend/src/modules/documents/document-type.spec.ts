// Document type — labels and slugs into the closed enum

import { DOCUMENT_TYPE_LABELS, InvalidDocumentTypeError, normalizeDocumentType } from './document-type';

describe('normalizeDocumentType', () => {
  it('accepts the UI labels', () => {
    expect(normalizeDocumentType('Habilitação de crédito')).toBe('HABILITACAO_CREDITO');
    expect(normalizeDocumentType('Divergência de crédito')).toBe('DIVERGENCIA_CREDITO');
    expect(normalizeDocumentType('Habilitação ACG')).toBe('HABILITACAO_ACG');
    expect(normalizeDocumentType('Outros')).toBe('OUTROS');
  });

  it('accepts slugs and sloppy casing', () => {
    expect(normalizeDocumentType('habilitacao-de-credito')).toBe('HABILITACAO_CREDITO');
    expect(normalizeDocumentType('divergencia-de-credito')).toBe('DIVERGENCIA_CREDITO');
  });

  it('rejects anything outside the closed set', () => {
    expect(() => normalizeDocumentType('Procuração')).toThrow(InvalidDocumentTypeError);
    expect(() => normalizeDocumentType('')).toThrow(InvalidDocumentTypeError);
  });

  it('labels round-trip the enum', () => {
    expect(DOCUMENT_TYPE_LABELS.HABILITACAO_CREDITO).toBe('Habilitação de crédito');
    expect(DOCUMENT_TYPE_LABELS.OUTROS).toBe('Outros');
  });
});
