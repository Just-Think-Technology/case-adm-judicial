# Architecture

## Deployment shape

- **Modular monolith, not microservices.** The system fits one PostgreSQL, one
  SeaweedFS and one Lightsail instance. A NestJS app with domain modules costs
  nothing extra in latency and removes an entire class of deploy/network
  problems. A module is a **code boundary, not a deploy boundary**.
- Two deployable apps only: the **NestJS backend** (`:3000` internal) and the
  **Next.js frontend** (`:3001` internal). They talk over HTTP through the
  **reverse proxy** (Caddy), which is the only published port.
- Support services are **stateful and internal**: `postgres` and `seaweedfs`
  are reachable only inside the compose network — never published to the host.
- Health endpoints are **excluded from the API prefix** and answer on
  `/health` directly, so an orchestrator can probe the container without the
  proxy.

## Module boundaries

- The backend is split in **modules by domain**: `auth`, `cases`, `documents`,
  `accounts`, `notifications`. Each owns its data access and its business rules,
  and exposes them through its own service.
- **No module reaches into another module's tables to write.** Cross-module
  reads go through the owning module's service/repository. Authorization is
  always enforced by the module that owns the resource.
- The frontend **never talks to the database or to storage directly**: it calls
  the backend only through the gateway, and it treats the backend as the source
  of truth for status, visibility, ownership, role and verification state.
- The gateway owns TLS, the public `/api` prefix and the per-route rate-limit
  budget (see [Rate limiting](../security/rate-limiting.md)).
- Document access is always resolved server-side: the client never decides
  whether it may see a document
  (see [Document visibility](../decisions/document-visibility.md)).

## Inside a module

Feature folders (`cases/`, `documents/`, `accounts/`), each with
controller/handler / service / repository (data access). Strict layering for
new code:

1. **Controller** — transport only: route, guard, DTO validation, status
   codes, response shape
2. **Service** — business rules, orchestration, transaction boundaries,
   notifications, storage calls
3. **Repository** — the only place that talks to **Prisma**; controllers never
   touch Prisma, services never embed queries outside repositories
4. **DTO** on every input (class-validator, messages in Brazilian Portuguese)
   + a Swagger/OpenAPI decorator

The Prisma schema lives in **one place only** — `backend/prisma/schema.prisma` —
and the client is generated from it; `prisma/` is not edited by hand in
generated files and never duplicated.

No shortcut is allowed for speed: a controller that writes a query, or a
service that decides authorization inline, is a review blocker.

## Cross-cutting concerns

- Logging, e-mail, storage, validation, rate limiting, security headers, guards
  and the global exception filter live in **one shared module** inside
  `backend/` (e.g. `backend/src/common/`), each consumed by every domain module.
  Nothing in this list is implemented twice.
- The frontend has its own single home for the API client, the session handling
  and the security headers (`frontend/lib/`), imported by every route.
- **Second-use rule:** code needed by a second feature or module is extracted
  to the shared location by the task that creates the second usage — never a
  second copy.

## Auth and authorization

- **Authentication** (who you are) and **authorization** (what you may do) are
  separate concerns. Guards validate the session/token; policies decide
  per-resource access.
- Authorization decisions are made **server-side on every request**, from the
  authenticated role, the resource owner and the document visibility state —
  never from anything the browser sends.
- The three usage situations (VISITOR, CREDITOR, ADMIN) are defined in
  [Accounts and access](../decisions/accounts-and-access.md). ADMIN-only actions
  are declared in a single place per module, not re-implemented ad hoc.
- `403 Forbidden` means "authenticated but not allowed"; unauthenticated access
  to a protected resource redirects to login. Resource that does not exist or
  is not visible to the caller is `404`. Guests are the single exception: they
  can list and read **public** cases and documents by design
  (see [Document visibility](../decisions/document-visibility.md)).

## Files, storage and delivery

- Uploaded files are stored in object storage; the database keeps only
  metadata (key, size, mime type, extension, content hash, owner, case id,
  visibility, status).
- **The browser never receives a direct, permanent object URL for a private
  document.** Reads go through the backend, which checks authorization first and
  then streams or redirects to a short-lived signed URL
  (see [Document storage](../decisions/document-storage.md)).
- Deleting a document deletes the stored object; deleting a case or a client
  deletes the documents it owns. No soft delete for documents.

## Orthogonality

Every piece of knowledge has a single authoritative representation.
Concretely:

- **One home per logic:** visibility rules, status rules, upload rules and
  access rules each have exactly one decision document in
  [.agents/decisions/](../decisions/); the corresponding implementation has exactly
  one home in the code (policy/guard/service), consumed by API, UI and tests.
- **Consume, don't copy:** modules import the shared home instead of
  re-implementing guards, validators, e-mail, storage or logging.
- **Specialize, don't fork:** a module extends or wraps the shared logic
  (e.g. a stricter throttle on the upload route) instead of duplicating it
  with tweaks.
- **Independent changes:** a change in one module must not require coordinated
  edits elsewhere. Changes to a shared API/contract are announced beforehand
  (see "Code standards" in [AGENTS.md](../../AGENTS.md)).
- **Shared core in English** (identifiers, comments); user-facing Portuguese
  copy stays at the edges (validation messages, e-mails, UI text).
