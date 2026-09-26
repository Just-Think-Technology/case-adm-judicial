# Rate Limiting

- **Status:** Accepted — inherited from the functional contract
  ([docs/base-system-features.md §6.5](../../docs/base-system-features.md)) and from the previous
  project's baseline
- **Implementation:** NestJS `@nestjs/throttler` behind the reverse proxy;
  in-memory storage is **sufficient** — the whole system is one instance
  (see below)

## Global limit

A **global per-IP limit** protects every route, applied at the gateway/entry
point so it also covers static and health traffic. Baseline target:
**100 requests/minute per IP**.

## Stricter limits on sensitive routes

| Route | Limit | Rationale |
|---|---|---|
| `POST /auth/login` | 10 req/min per IP+email | brute force on credentials |
| `POST /auth/register` | **5 accounts per IP** (hard cap, persisted) | mass account creation; see [accounts and access](../decisions/accounts-and-access.md) |
| `POST /auth/verification-notification` | 6 req/min **+ 5 min cooldown per user** | e-mail bombing; the legacy behavior is the reference |
| `POST /auth/forgot-password` | 5 req/min per IP | e-mail bombing via password reset |
| `POST /documents` (upload) | 20 req/min per account | bandwidth abuse and object-storage cost |
| `GET /documents/:id/content` (open/download) | 60 req/min per account | scraping of public documents |

Rules:

- The **account cap of 5 per IP is not time-based**: it survives restarts and
  is evaluated before the account is created.
- Limits are **per authenticated account** when a session exists, and **per IP**
  otherwise (guests have no account to throttle).
- Exceeding a limit returns a **PT-BR message that tells the user what to do**
  ("Por favor, aguarde antes de tentar novamente") — never a bare 429 page.
- Throttling decisions are server-side. The client-side hints (disabled
  buttons, live validation) are usability, not security.

## Implementation

- **One centralized throttler configuration** in the backend, applied to every
  route; per-route overrides are declared as route metadata, never inline in a
  handler.
- **No Redis.** There is a single app instance, so in-memory storage holds the
  budget correctly for its lifetime. A restart clears the windows — acceptable
  for abuse control. If the backend is ever scaled to more than one replica,
  this decision must be revisited (the decision record is the place to say so).
- **Reverse proxy** contributes its own connection/rate ceiling as the outermost
  layer; application limits stay authoritative for the sensitive routes.
- The **5-accounts-per-IP cap is stored in the database**, not in memory, so it
  survives restarts and redeploys. It is the one limit that must not be lost.
- Tests cover: limit hit, window reset, per-account vs per-IP keying, and that
  the account cap is not cache-dependent.

## Related

- [Personal data and judicial secrecy](personal-data-and-secrecy.md) — why the
  upload and download routes are the sensitive ones here
