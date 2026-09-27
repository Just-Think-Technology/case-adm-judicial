// CSRF service — double-submit token issuance

import { CsrfService } from './csrf.service';

describe('CsrfService', () => {
  const csrf = new CsrfService();

  it('issues a 256-bit token as hex', () => {
    expect(csrf.issueToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('issues a fresh token on every call', () => {
    expect(csrf.issueToken()).not.toBe(csrf.issueToken());
  });
});
