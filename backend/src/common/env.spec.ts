// Environment — required variable reading

import { requiredEnv } from './env';

describe('requiredEnv', () => {
  const previousEnv = { ...process.env };

  afterEach(() => {
    process.env = previousEnv;
  });

  it('returns the value when it is set', () => {
    process.env.ENV_SPEC_SET = 'some-value';

    expect(requiredEnv('ENV_SPEC_SET')).toBe('some-value');
  });

  it('fails fast on a missing variable instead of an opaque error later', () => {
    delete process.env.ENV_SPEC_MISSING;

    expect(() => requiredEnv('ENV_SPEC_MISSING')).toThrow('ENV_SPEC_MISSING is not set');
  });

  it('treats a blank variable as missing', () => {
    process.env.ENV_SPEC_BLANK = '   ';

    expect(() => requiredEnv('ENV_SPEC_BLANK')).toThrow();
  });
});
