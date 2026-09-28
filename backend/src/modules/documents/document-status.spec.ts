// Document status — labels and tolerant input into the closed enum

import { InvalidDocumentStatusError, STATUS_LABELS, normalizeDocumentStatus } from './document-status';

describe('normalizeDocumentStatus', () => {
  it('accepts the three labels', () => {
    expect(normalizeDocumentStatus('Em análise')).toBe('EM_ANALISE');
    expect(normalizeDocumentStatus('Deferido')).toBe('DEFERIDO');
    expect(normalizeDocumentStatus('Indeferido')).toBe('INDEFERIDO');
  });

  it('accepts slugs and sloppy casing', () => {
    expect(normalizeDocumentStatus('em-analise')).toBe('EM_ANALISE');
    expect(normalizeDocumentStatus('DEFERIDO')).toBe('DEFERIDO');
  });

  it('rejects anything outside the trio', () => {
    expect(() => normalizeDocumentStatus('Aprovado')).toThrow(InvalidDocumentStatusError);
    expect(() => normalizeDocumentStatus('')).toThrow(InvalidDocumentStatusError);
    expect(() => normalizeDocumentStatus(['x'] as unknown as string)).toThrow(InvalidDocumentStatusError);
  });

  it('labels the trio in PT-BR', () => {
    expect(STATUS_LABELS.EM_ANALISE).toBe('Em análise');
    expect(STATUS_LABELS.DEFERIDO).toBe('Deferido');
    expect(STATUS_LABELS.INDEFERIDO).toBe('Indeferido');
  });
});
