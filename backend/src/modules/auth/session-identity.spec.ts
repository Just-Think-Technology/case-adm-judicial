// Session identity — cookie to account, without deciding anything

import { resolveSessionIdentity } from './session-identity';

describe('resolveSessionIdentity', () => {
  const claims = { sub: 'user-1', role: 'CREDITOR', emailVerified: true, jti: 'session-1' };

  it('names the account behind a valid cookie', () => {
    const tokens = { verifyAccess: jest.fn().mockReturnValue(claims) };

    const identity = resolveSessionIdentity({ access_token: 'raw' }, tokens);

    expect(identity).toEqual({
      id: 'user-1',
      role: 'CREDITOR',
      emailVerified: true,
      sessionId: 'session-1',
    });
  });

  it('names nobody when the cookie is missing or empty', () => {
    const tokens = { verifyAccess: jest.fn() };

    expect(resolveSessionIdentity({}, tokens)).toBeUndefined();
    expect(resolveSessionIdentity({ access_token: '' }, tokens)).toBeUndefined();
    expect(resolveSessionIdentity(undefined, tokens)).toBeUndefined();
    expect(tokens.verifyAccess).not.toHaveBeenCalled();
  });

  it('names nobody when the signature does not verify', () => {
    const tokens = {
      verifyAccess: jest.fn().mockImplementation(() => {
        throw new Error('invalid signature');
      }),
    };

    expect(resolveSessionIdentity({ access_token: 'forged' }, tokens)).toBeUndefined();
  });
});
