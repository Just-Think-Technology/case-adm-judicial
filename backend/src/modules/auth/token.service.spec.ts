// Token service — access JWT, opaque refresh and e-mail tokens

import { TokenService } from './token.service';

describe('TokenService', () => {
  const tokens = new TokenService('test-access-secret-change-me-32chars');

  it('refuses a short secret instead of signing weak tokens', () => {
    expect(() => new TokenService('short')).toThrow(/at least 32 characters/);
  });

  it('signs an access token carrying sub, role, verification and session', () => {
    const raw = tokens.signAccess({
      sub: 'user-1',
      role: 'CREDITOR',
      emailVerified: true,
      jti: 'session-1',
    });

    const payload = tokens.verifyAccess(raw);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('CREDITOR');
    expect(payload.emailVerified).toBe(true);
    expect(payload.jti).toBe('session-1');
  });

  it('rejects a tampered access token', () => {
    const raw = tokens.signAccess({
      sub: 'user-1',
      role: 'CREDITOR',
      emailVerified: true,
      jti: 'session-1',
    });

    expect(() => tokens.verifyAccess(`${raw}tampered`)).toThrow();
  });

  it('rejects a token signed with another secret', () => {
    const other = new TokenService('another-secret-change-me-32chars!!');
    const raw = other.signAccess({
      sub: 'user-1',
      role: 'CREDITOR',
      emailVerified: true,
      jti: 'session-1',
    });

    expect(() => tokens.verifyAccess(raw)).toThrow();
  });

  it('issues opaque refresh tokens that never contain the user id', () => {
    const { raw, hash } = tokens.newOpaqueToken();

    expect(raw).not.toContain('user-1');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(tokens.hashToken(raw));
  });

  it('issues a fresh opaque value on every call', () => {
    expect(tokens.newOpaqueToken().raw).not.toBe(tokens.newOpaqueToken().raw);
  });
});
