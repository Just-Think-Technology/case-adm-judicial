# Personal Data and Judicial Secrecy (LGPD)

- **Status:** Accepted — derived from the nature of the product
  (creditors' personal data + judicial documents)

This system handles **personal data** (creditor's name, e-mail, IP address at
registration, profile picture) and **confidential judicial documents**. The
baseline is confidentiality by default.

## Rules

- **Confidential by default.** A document is `private` unless an ADMIN made it
  public. There is no "public on upload for creditors" path — the default in
  [document visibility](../decisions/document-visibility.md) is private.
- **Never log document content**, file contents, descriptions, names or
  e-mail addresses beyond what the feature requires. Logs carry **ids**, roles,
  counts, action results and error codes — never the payload of a document.
- **Never log credentials or secrets**: password, token, signed URL, storage
  key with signature, session identifier. Passwords are stored hashed, never
  reversible.
- **Never expose a permanent public URL for a private document.** Reads are
  authorized server-side and delivered by streaming or by a short-lived signed
  URL ([document storage](../decisions/document-storage.md)).
- **Do not disclose account existence** on public forms (verification resend,
  password reset): unknown and already-verified e-mails get the same message.
- **Data minimization:** the IP address is collected only to enforce the
  5-accounts-per-IP rule, and lives in the application database (no analytics,
  no third-party tracking, no behavioral profiling).
- **No third-party sharing.** Creditor data is not sent to any external service.
  E-mail is used only for the transactional messages listed in
  [accounts and access](../decisions/accounts-and-access.md) and for the
  internal new-document notice; the e-mail provider is an infrastructure
  dependency to be reviewed before production, because it processes personal
  data.
- **Deletion is real deletion:** removing a client removes their documents,
  files and profile picture (no soft delete, no trash, no restore).
- Profile picture is personal data with a short lifecycle: it is deleted
  together with the account.

## Responses to users

- The portal explains what the system does with the data in plain language
  (privacy notice) — **TBD**: creating it is a product task, and its copy lives
  in the frontend, not in a decision record.
- E-mails never embed document content; they carry only what the recipient is
  already entitled to see (e.g. the internal notice carries name, case, type).

## Data subject requests

- Access, correction and deletion of a creditor's own data happen through the
  judicial administration team, out of the product. The product offers the
  creditor self-service for name, e-mail, password and picture only.
- Any new self-service scope is a new decision record.

## Review triggers

Revisit this file if the system starts storing: sensitive economic data,
identification documents, health data, third-party personal data, or if
analytics/third-party tools are introduced.
