# Document Visibility

- **Status:** Accepted — inherited from the functional contract
  ([docs/base-system-features.md §4.12, §6.1](../../docs/base-system-features.md))
- **Scope:** every read of a document — list query, detail, open/download,
  share — in every module and surface

## Decision

Every document carries a visibility flag with exactly two values:

| Value | Meaning |
|---|---|
| `publico` (public) | readable by anyone, **including visitors with no account** |
| `privado` (private) | readable only by the owner, admins, and — when the document was sent by an admin — any authenticated account |

**Default on upload:** `privado` for CREDITOR, `publico` for ADMIN. This is the
only automatic visibility rule; everything else is an explicit admin action.

**Who changes it:** ADMIN only, through a dedicated action (never as a side
effect of another action, never through a bulk import).

## Read matrix

| Who is reading | public | private sent by CREDITOR | private sent by ADMIN |
|---|---|---|---|
| **VISITOR** (not authenticated) | sees it | does not see it | does not see it |
| **CREDITOR** | sees it | sees **own** only | sees it |
| **ADMIN** | sees it | sees it | sees it |

## Listing rules

- **VISITOR:** only public documents, of any case, plus the case data itself
  (the transparency layer is part of the product).
- **CREDITOR:** public documents, documents sent by admins, and own documents.
- **ADMIN:** all documents of the case. *(Legacy note: the legacy panel listed
  only admin-sent documents on the case screen — that inconsistency is not
  inherited; see [Restrições](../../docs/base-system-features.md)
  item 1.)*

Listing and reading must agree: a document that appears in a list must be
readable by whoever the list was rendered for. When in doubt, hide the row —
leaking a name or a link in a list is already a disclosure.

## Status codes

| Situation | Response |
|---|---|
| Unauthenticated access to a protected resource | redirect to login (never a bare `401` on a browser navigation) |
| Authenticated but not permitted (private document of another creditor, admin-only action) | `403 Forbidden` |
| Document does not exist **or** is not visible to the caller | `404 Not Found` — never reveal the existence of a private document to an unauthorized caller |

## Consequences

- The visibility check is implemented **once** and reused by the list query,
  the read/download action and the tests (orthogonality rule in
  [architecture.md](../rules/architecture.md)).
- The browser never decides visibility: it may render a toggle, but the state
  sent to the server is ignored in favour of the stored one
  (backend is the source of truth).
- Changing this document is a **public contract change**: it must be announced,
  update [AGENTS.md](../../AGENTS.md), and ship with matrix tests for the three
  roles.

## Related

- [Document storage](document-storage.md) — how a visible document is
  delivered to the reader
- [Accounts and access](accounts-and-access.md) — who the roles are
- [Personal data and judicial secrecy](../security/personal-data-and-secrecy.md)
