# Document Status

- **Status:** Accepted — inherited from the functional contract
  ([docs/base-system-features.md §4.11, §6.2](../../docs/base-system-features.md))

## The three states

| Label (PT-BR, shown to the user) | Meaning |
|---|---|
| **Em análise** | Default on upload; waiting for a decision |
| **Deferido** | Accepted by the judicial administration |
| **Indeferido** | Rejected |

Rules:

- A document **always has a status**; there is no "pending creation" state.
- The initial value is set by the system, never by the client.
- The set of states is **closed**: no other value is accepted, including from
  an API caller. Values outside the set are rejected, not stored.
- Any state can go to any other state (including back to *Em análise*) — there is
  no terminal state and no irreversible transition.

## Who changes it

- **ADMIN only.** CREDITOR never changes the status of a document, and never
  the status of anybody else's.
- The decision belongs to the analysis screen of a client
  (list of documents per creditor); the status is a property of the document,
  not of the case.

## Saving

- Changes are made in the interface and saved **in batch** (a single save
  applies every pending change), with an explicit confirmation
  (*“Alterações salvas com sucesso!”*).
- Saving with no pending change is a no-op, not an error the user must dismiss.
- A failure saves nothing: the whole batch is rejected and the pending changes
  stay in the interface for a retry.

## No history

- **No status history is kept.** Only the current status is persisted. There is
  no audit trail of who deferred or indeferred a document, and no undo.
- Consequence to keep in mind when designing: any future requirement for audit
  or appeal is a **new decision record** (and a migration), not an extension of
  this one.
- The interface may show "editado — era: *&lt;status anterior&gt;*" **while the
  user is editing**, before saving. It is a transient affordance, not history.

## Consequences

- The status label, its colour and its meaning have exactly one definition,
  shared by the case screen, the per-client table and the statistics counters.
- The statistics shown on the per-client screen are true totals across all of
  the client's documents, not the displayed page (deliberate change: page-scoped
  counters misled instead of summarizing; see
  [Restrições](../../docs/base-system-features.md)
  item 8).
- Status is **never** trusted from the browser: the server validates role and
  allowed values.

## Related

- [Document visibility](document-visibility.md)
- [Document storage](document-storage.md)
- [Accounts and access](accounts-and-access.md)
