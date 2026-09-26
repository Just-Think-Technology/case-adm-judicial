# Task Checklists

Pick the matching type before coding. All types also follow the
[Security baseline](../../AGENTS.md#security-baseline) and the functional
contract in [docs/base-system-features.md](../../docs/base-system-features.md).

Command names come from [AGENTS.md § Main commands](../../AGENTS.md#main-commands)
— run each from the directory recorded there, never a guess.

## TDD — red → green → refactor

- [ ] **Red first:** commit a failing test (or a test run proof) before any
      production code — implement the minimal green after the red commit;
      PR review must show the red→green sequence (see CI check below)
- [ ] Unit specs on seams/mappers (pure functions), integration specs through
      the HTTP layer + a real test database — no repository tautologies
- [ ] E2E covers the vertical slice when a new journey is added (the journeys in
      [docs/base-system-features.md §5](../../docs/base-system-features.md) are
      the reference list)

## New endpoint (backend)

- [ ] DTO with `class-validator` (**messages in Brazilian Portuguese**) +
      Swagger/OpenAPI decorator
- [ ] Guard + role check — who may call it?
- [ ] Authorization on the resource itself by id → `403` on mismatch
      (see [Document visibility](../decisions/document-visibility.md))
- [ ] Compute/lookup status, visibility, ownership, case id and verification
      state in the backend — never trust the frontend
- [ ] Stricter throttle on sensitive routes
      (see [Rate limiting](../security/rate-limiting.md))
- [ ] Tests for the happy path + the 401/403/404 cases of the visibility matrix;
      run lint and typecheck
- [ ] Frontend caller updated in the same PR when the endpoint is consumed by a
      screen (never a client that calls a URL which no longer exists)

## Document upload endpoint

- [ ] Formats and size limits enforced **before** storage
      (see [Document storage](../decisions/document-storage.md)); the client-side
      check is a convenience, the server is the authority
- [ ] File is **streamed** to SeaweedFS — never buffered fully in memory, never
      written to a public path or to the local disk first
- [ ] Content hash (SHA-256) computed and dedup handled — a repeated file is
      rejected with a clear PT-BR message, not a 500 (the hash is unique in the
      database)
- [ ] Transaction boundary: row, object and notification do not half-commit — a
      failed e-mail must not roll back a saved document
- [ ] Status starts as `Em análise`; visibility default is **private** for
      CREDITOR and **public** for ADMIN
- [ ] No file name, description or content leaked into logs
- [ ] Throttle applied to the route
- [ ] Tests: allowed/denied format, oversize, duplicate content, missing case,
      unverified account, guest (redirect), and object removal on delete

## Change in visibility rules

- [ ] Announce it (public contract change) and update
      [document-visibility.md](../decisions/document-visibility.md) in the same
      PR
- [ ] Update every consumer: list query, file read/download, guards and tests —
      a rule that lives in only one of them is a leak
- [ ] Add the matrix row as an explicit test case per role
      (visitor / creditor / admin)

## Migration (PostgreSQL)

- [ ] Schema change declared in `backend/prisma/schema.prisma`;
      `prisma migrate dev` locally and **review the generated SQL** before
      applying
- [ ] Default/backfill for existing rows when adding a required column
      (e.g. `status` default `Em análise`, visibility default private)
- [ ] New tables get the least-privilege grants
      (see [Database](../decisions/database.md))
- [ ] Plan the cascade for deleted records (case/client deletion removes
      documents) and test it
- [ ] **Never** run reset/drop/mass-delete against staging/production data
- [ ] Update the affected tests and run the full affected suites

## New screen or UI flow (Next.js)

- [ ] Route lives under `frontend/app/`; the path follows the public contract
      in [docs/base-system-features.md](../../docs/base-system-features.md)
- [ ] Checked against the 10
      [Nielsen heuristics](nielsen-heuristics.md) — evidence attached
- [ ] The four states exist: **loading, empty, error, success** (App Router
      `loading.tsx` / `error.tsx` where they apply, plus a real empty state — a
      spinner is not an empty state)
- [ ] Server components by default; no data fetching duplicated in the client
- [ ] Confirmation before any destructive action, wording states it is
      irreversible
- [ ] Validation messages in Brazilian Portuguese, actionable and specific
- [ ] Profile differences covered (visitor, creditor, admin) — hidden **and**
      disabled affordances
- [ ] A guest hitting a protected screen is redirected to login, not shown a
      broken page

## New e-mail template

- [ ] Template is PT-BR, on-brand, and readable as plain text as well as HTML
- [ ] Contains no judicial document content and no secret/link that leaks data
      (see [Personal data](../security/personal-data-and-secrecy.md))
- [ ] Link/token has an explicit expiry and a friendly failure message
- [ ] Failure of the e-mail is handled explicitly and never blocks the user
      action that triggered it
- [ ] Recorded in [document-storage](../decisions/document-storage.md) or
      [accounts-and-access](../decisions/accounts-and-access.md), whichever owns
      the trigger

## New backend module

- [ ] Named after the domain (`auth`, `cases`, `documents`, `accounts`,
      `notifications`), registered in `backend/src/`
- [ ] Guard + role pattern copied from an existing module
- [ ] Helmet via the centralized security config + throttler wired
- [ ] Repository used for every data access (Prisma only inside repositories)
- [ ] CI: added to the lint/test/build chains
- [ ] **Update AGENTS.md** (layout, commands) in the same PR

## Infra / deploy change

- [ ] `docker-compose.yml` (local/staging) and
      `docker-compose.production.yml` updated **in the same PR**
- [ ] No new published port — only the reverse proxy is exposed; `postgres` and
      `seaweedfs` stay internal
- [ ] Volumes declared for every stateful service (`postgres`, `seaweedfs`)
- [ ] Health checks defined for the services that need them
- [ ] Backups still cover the change (a new volume or database needs a dump —
      see [Backups](../security/backups.md))
- [ ] Hadolint passes on any new/changed `Dockerfile`

## CI verification (TDD red → green)

- PR history must contain a red commit (failing test run proof) before the
  green implementation commit. Reviewers verify the sequence; CI enforces the
  green state. A missing red commit fails review, not the build.
- Documented in
  [.agents/security/ci-pipeline.md](../security/ci-pipeline.md#tdd-red--green).
