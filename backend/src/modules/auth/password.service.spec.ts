// Password service — argon2id hashing contract

import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('hashes a password into a non-reversible argon2id string', async () => {
    const hash = await passwords.hash('Admin@123');

    expect(hash).not.toContain('Admin@123');
    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it('verifies the correct password', async () => {
    const hash = await passwords.hash('Admin@123');

    await expect(passwords.verify(hash, 'Admin@123')).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await passwords.hash('Admin@123');

    await expect(passwords.verify(hash, 'admin@123')).resolves.toBe(false);
  });

  it('produces a different hash for the same password twice', async () => {
    const first = await passwords.hash('Admin@123');
    const second = await passwords.hash('Admin@123');

    expect(first).not.toBe(second);
  });
});
