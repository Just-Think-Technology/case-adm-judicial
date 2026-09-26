# Encryption at Rest — Decision Record

- **Status:** Accepted — carried over from the previous project, re-reasoned for
  this data

- **Decision:** no application-level encryption at rest.
- **Rationale:** the sensitive asset here is the **judicial document set**. The
  protection chosen is layered instead of application-level crypto:
  - the object storage holding documents is **private**, with read access only
    through the authorized backend path
    ([document visibility](../decisions/document-visibility.md),
    [document storage](../decisions/document-storage.md));
  - passwords are stored **hashed** (salted, slow algorithm);
  - e-mails, tokens and signed URLs are short-lived;
  - the infrastructure layer provides **disk/instance encryption** on the
    Lightsail volume, covering both the PostgreSQL data directory and the
    SeaweedFS volume;
  - **transport** is TLS in every environment that is not local-only.
- **Revisit if:** the object storage leaves the same trust boundary (managed S3,
  a second instance), the database moves to a managed engine without volume
  encryption, LGPD or the court requires it, or a cryptographic requirement is
  imposed by the judicial administration team.
- **Never:** store a document, a token or a credential in plaintext "temporarily"
  — the correct place is a private bucket, not a secret in the config file.
