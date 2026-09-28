// Document access — the read matrix as explicit cases

import { canReadDocument } from './document-access';

describe('canReadDocument', () => {
  const publicDoc = { visibility: 'PUBLICO' as const, ownerId: 'owner-1', ownerRole: 'CREDITOR' };
  const creditorPrivate = { visibility: 'PRIVADO' as const, ownerId: 'owner-1', ownerRole: 'CREDITOR' };
  const adminPrivate = { visibility: 'PRIVADO' as const, ownerId: 'admin-1', ownerRole: 'ADMIN' };

  const admin = { id: 'admin-9', role: 'ADMIN' };
  const owner = { id: 'owner-1', role: 'CREDITOR' };
  const stranger = { id: 'other-2', role: 'CREDITOR' };

  it('shows public documents to everyone including visitors', () => {
    expect(canReadDocument(publicDoc, undefined)).toBe(true);
    expect(canReadDocument(publicDoc, stranger)).toBe(true);
    expect(canReadDocument(publicDoc, admin)).toBe(true);
  });

  it('hides creditor-private documents from visitors and strangers', () => {
    expect(canReadDocument(creditorPrivate, undefined)).toBe(false);
    expect(canReadDocument(creditorPrivate, stranger)).toBe(false);
  });

  it('shows owners their own private documents', () => {
    expect(canReadDocument(creditorPrivate, owner)).toBe(true);
  });

  it('shows admins everything', () => {
    expect(canReadDocument(creditorPrivate, admin)).toBe(true);
    expect(canReadDocument(adminPrivate, admin)).toBe(true);
  });

  it('shows admin-sent private documents to any authenticated account', () => {
    expect(canReadDocument(adminPrivate, stranger)).toBe(true);
    expect(canReadDocument(adminPrivate, undefined)).toBe(false);
  });
});
