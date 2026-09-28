import { describe, expect, it } from 'vitest';
import { checkPassword, passwordValid } from './password-rules';

describe('checkPassword', () => {
  it('passes every rule for a strong matching pair', () => {
    const checks = checkPassword('Segura@123', 'Segura@123');
    expect(passwordValid(checks)).toBe(true);
  });

  it('flags each missing rule independently', () => {
    const byId = Object.fromEntries(checkPassword('abc', 'abc').map((c) => [c.id, c.passes]));
    expect(byId).toMatchObject({
      length: false,
      upper: false,
      lower: true,
      digit: false,
      special: false,
      match: true,
    });
  });

  it('requires confirmation to match a non-empty password', () => {
    expect(passwordValid(checkPassword('Segura@123', 'Outra@123'))).toBe(false);
    expect(passwordValid(checkPassword('', ''))).toBe(false);
  });
});
