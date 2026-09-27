// CSRF service — double-submit token issuance

import { randomBytes } from 'node:crypto';

/**
 * Issues the token half of the double-submit check. Stateless by design: the
 * server never stores it, it only compares the cookie value against the header
 * value on the way back in (see csrf.guard.ts).
 */
export class CsrfService {
  issueToken(): string {
    return randomBytes(32).toString('hex');
  }
}
