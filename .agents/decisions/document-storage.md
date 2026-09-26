# Document Storage and Upload

- **Status:** Accepted — inherited from the functional contract
  ([docs/base-system-features.md](../../docs/base-system-features.md) §4.9,
  §4.10, §6.2, §6.5) with SeaweedFS as the engine
- **Engine:** SeaweedFS (S3-compatible API), private bucket, internal to the
  compose network

## Decision

### Storage

- Documents live in **SeaweedFS** through its S3 API, in a dedicated bucket
  (`documents`) separate from profile pictures. The database stores metadata
  only.
- SeaweedFS runs in the compose stack (master + volume + filer + S3) and is
  **not published to the host**. The backend reaches it over the internal
  network (`:8333`).
- The object key is **server-generated**. The original file name is kept as the
  document name for display and download, and the **original extension is
  appended** to it when the user typed a name without one.
- The bucket is **private**: anonymous access is never enabled and nothing is
  served from a permanent public URL.
- Reads go through the backend: it checks authorization
  ([document visibility](document-visibility.md)) and then either streams the
  object or returns a **short-lived presigned URL (15 minutes)**.
- **Gateway caveat:** Caddy strips `/api/v1/storage` for the storage route and
  must preserve `Host` — the S3 SigV4 signature includes the host, so a
  rewritten host invalidates the presigned URL. Carried over from the previous
  project; verify when wiring the proxy.

### Accepted formats and limits

| Rule | Value |
|---|---|
| Formats | PDF, JPEG, JPG, PNG, DOCX, XLSX |
| Max size per file | 40 MB (the client checks this for convenience; the **server is the authority**) |
| Document name | required, up to 255 characters |
| Description | up to 1000 characters |
| Type | required; "Outros" requires a free-text specification |
| Case | required and must exist |

In-browser formats (PDF, images, plain text/HTML/CSV) are served **inline**;
everything else is served as a **download**. This is a delivery decision, not a
security boundary — it never bypasses the authorization check.

### Upload mechanics

- The file is **streamed** from the request to SeaweedFS. It is never buffered
  fully in memory and never written to the local disk first.
- SeaweedFS volume capacity and the 40 MB per-file limit are the only upload
  constraints; a body-size limit must be set at the proxy **and** in the
  application so the two agree (a 100 MB body limit was used in the previous
  project, leaving headroom for multi-part overhead).
- **Why not the obvious alternatives:** the upload screen sends 3 files
  concurrently (§4.9 of the functional contract) and the production backend
  runs under a 512 MB memory limit
  (`deploy/docker-compose.production.yml`). Buffering in memory would hold
  3 × 40 MB per user; writing to a temp path would put a judicial document on
  the app filesystem — which, in dev, is the repository working tree, because
  the compose stack mounts `../` at `/app`. Stream from request to bucket, or
  the container runs out of memory.

### Content identity

- Every file gets a **SHA-256 content hash** on upload.
- The same content **cannot be uploaded twice** (unique index in the database).
  The user receives a clear, actionable message in PT-BR — a duplicate upload
  is a **user error**, not a 500.
- Rationale: in a judicial process, re-uploading the same file under a second
  name inflates the case record and hides duplicates from the analysis.

### Deletion

- Deleting a document deletes the **stored object** and the record. There is no
  soft delete, no trash and no restore.
- Deleting a case or a client removes **all** documents they own, in the same
  operation. A failure to remove an object is logged and surfaced — never
  silently ignored, and never left as a permanent orphan.
- Profile pictures are a separate object class with the same deletion rule
  (see [Personal data](../security/personal-data-and-secrecy.md)).

## Consequences

- Upload is a transaction boundary: record + object + notification must not
  half-commit. A **failed notification e-mail never rolls back a saved
  document** — the user keeps their upload and the office is alerted internally.
- No document name, description or content is ever written to application logs.
- Upload routes carry a stricter throttle
  ([rate limiting](../security/rate-limiting.md)).
- Backups must cover both the database rows and the SeaweedFS volume
  ([backups](../security/backups.md)) — a row without its object is a broken
  restore.

## Related

- [Document visibility](document-visibility.md) — who may read a stored object
- [Document status](document-status.md) — the analysis state of the record
