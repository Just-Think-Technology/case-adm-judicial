# Agents

Instructions and context for AI agents (e.g. opencode) working on this project.
Single source of truth for product decisions, development rules and architecture.

> **Self-maintenance rule:** when a task changes any decision recorded here
> (new module, new product rule, new security policy, new deploy step),
> updating this file and the linked docs is part of the task — see
> "Task flow" step 7.

## What this project is

**Portal do Credor** — Case Administração Judicial. Credors of companies in
**Recuperação Judicial** or **Falência** use it to send documents for a case and
follow the analysis of their requests; the judicial administration team uses it
to register the cases, decide which documents are public, and mark documents as
deferido/indeferido.

| Item | Reference |
|---|---|
| **Functional contract** (what the system must do and how the user uses it) | [docs/base-system-features.md](docs/base-system-features.md) |
| **Legacy system** (reference only, read-only, never modify or port from) | `../case-adm-judicial-old/` |
| **Product/security decisions** | [.agents/](.agents/) |

**docs/base-system-features.md is the source of truth for behavior.** When code and that
document disagree, the document wins: fix the code, or change the document
deliberately (announced, in the same PR). Every feature task must trace back to
a section of it; anything not described there is a new feature request.

## Roles

Three usage situations, not three account types:

| Role | Meaning |
|---|---|
| **VISITOR** | Not authenticated. Sees the landing page, the panel with the registered cases, and **only public documents** |
| **CREDITOR** | Verified account. Uploads documents, sees own + admin + public documents, manages own profile |
| **ADMIN** | Judicial administration team. Everything the creditor does, plus cases CRUD, client administration, document status, document visibility, deletion of anything |

- **Admin is never granted through the product** — there is no promotion,
  invite or role-editing screen. Provisioning happens outside the product.
- **Admin accounts cannot be deleted** by the product, and an admin cannot
  delete their own account.
- Authenticated but unverified accounts **cannot log in** (see
  [Accounts and access](.agents/decisions/accounts-and-access.md)).

## Stack

* **Backend:** NestJS (TypeScript), modular monolith — one deployable app, not
  microservices; see [.agents/rules/architecture.md](.agents/rules/architecture.md)
* **Frontend:** Next.js (App Router), server components, consuming the backend
  only through the gateway
* **Database:** PostgreSQL, single instance in the compose stack
* **ORM / data access:** **Prisma** — schema in `backend/prisma/schema.prisma`,
  client generated in the backend; all data access lives in repositories
* **Document storage:** SeaweedFS with its S3 API (private bucket), accessed
  through the S3 client
* **Infra/deploy:** Docker Compose on **one AWS Lightsail instance**; only the
  reverse proxy is exposed
* **Package manager:** **pnpm** (single root `package.json` with workspaces for
  `backend` and `frontend`); `packageManager` is pinned and every Dockerfile
  activates the same version with corepack — never `pnpm@latest`

### Pinned versions

Verified against the registry on 2026-09-25. Bumps are atomic: update this
table, the root `package.json` `packageManager` and the Dockerfiles in the same
PR.

| Package | Version | Note |
|---|---|---|
| Node.js | 22.23.x | LTS line; the only version used in build and runtime images |
| pnpm | 11.25.0 | pinned via `packageManager` + corepack |
| NestJS | 12.1.0 | current major (decided 2026-09-25); companion packages must support v12 — `@nestjs/throttler` 6.x, `@nestjs/swagger` 12.x |
| Next.js | 16.3.6 | App Router |
| Prisma | 7.10.0 | **never install `prisma@latest`**: the `latest` dist-tag currently points to `8.0.0-rc.17`; always install the stable major explicitly |
| PostgreSQL | 17 | single instance in compose |
| SeaweedFS | `chrislusf/seaweedfs:3.97` | S3 gateway on `:8333`; the tag is recorded with the compose files |

## Monorepo layout

The tree below **must** be updated in the same PR that introduces or moves
anything, listing each top-level folder with a one-line purpose.

```text
backend/          # NestJS app: auth, cases, documents, accounts, notifications modules
frontend/         # Next.js app (App Router): public + authenticated screens
deploy/           # Compose + Caddy — deploy/Caddyfile, deploy/docker-compose.yml (dev hot-reload) and deploy/docker-compose.production.yml (Lightsail)
docs/             # Functional contract and project documentation
.agents/          # Security, product and deploy decisions (agent rules)
.env.example      # Root env template — cp .env.example .env, used by deploy/*.yml via env_file: ../.env (never commit .env)
```

No shared package between backend and frontend: they communicate only over
HTTP, through the gateway. If a package is ever introduced, the layout and
[architecture](.agents/rules/architecture.md) are updated in the same PR.

## Architecture

* **Modular monolith, not microservices.** The whole system fits one
  PostgreSQL and one instance; services over HTTP would add latency, deployment
  complexity and no benefit. Modules are a code boundary, not a deploy boundary
* **The backend is the source of truth** — never trust values coming from the
  browser: document status, visibility, company/case id, role, email
  verification state

* **The backend is the source of truth** — never trust values coming from the
  browser: document status, visibility, company/case id, role, email
  verification state
* **Layering:** controller/handler (HTTP + input validation) → service (business
  rules, transaction boundaries) → repository (data access). Controllers never
  reach the data layer; services never embed queries outside repositories
* **Validation on every input**, with **user-facing messages in Brazilian
  Portuguese**; code, identifiers and comments in English
* **Second-use rule:** code needed by a second place is extracted to a shared
  package/module by the task that creates the second usage — never a second copy
* **Orthogonality:** one authoritative home per logic. Document visibility rules
  live only in
  [.agents/decisions/document-visibility.md](.agents/decisions/document-visibility.md),
  upload/storage rules only in
  [.agents/decisions/document-storage.md](.agents/decisions/document-storage.md),
  status rules only in
  [.agents/decisions/document-status.md](.agents/decisions/document-status.md).
  UI, API and tests consume those rules; they never re-derive them
* **Guest access is a feature, not a bug:** the public transparency layer
  (cases + public documents without login) is part of the product contract

Full rules: [.agents/rules/architecture.md](.agents/rules/architecture.md).

## Main commands

**pnpm workspaces** with a single root `package.json` (`backend`, `frontend`).
Run each command **from the directory stated**; the scripts below are the
contract created in the first scaffolding commit.

```bash
# Backend — inside backend/
pnpm dev              # nest start --watch
pnpm build            # nest build
pnpm start            # production run of the built app
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm test             # Jest, unit specs
pnpm test:e2e         # Jest + supertest against a real test database
pnpm prisma:generate  # regenerate the Prisma client after a schema change
pnpm prisma:migrate   # prisma migrate dev (local only)
pnpm prisma:deploy    # prisma migrate deploy (deploy/production)
pnpm prisma:studio    # Prisma Studio — local only, never in production
pnpm seed             # create the local ADMIN account (admin@case.local) — no fake data; documents are uploaded by hand

# Frontend — inside frontend/
pnpm dev              # next dev
pnpm build            # next build
pnpm start            # next start
pnpm lint             # ESLint
pnpm format           # Prettier write
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest, unit specs
pnpm test:e2e         # Playwright, the journeys in docs/base-system-features.md §5

# Repository root
pnpm install          # installs both workspaces from the pinned lockfile
pnpm build            # builds both apps
docker compose --file deploy/docker-compose.yml up -d postgres seaweedfs   # local dependencies only (fast dev loop, apps on host)
docker compose --file deploy/docker-compose.yml up -d                      # full stack dev with hot-reload (backend pnpm dev, frontend pnpm dev via volumes)
docker compose --env-file .env --file deploy/docker-compose.yml --file deploy/docker-compose.production.yml up -d --build  # production-like via Caddy (only 80/443 published)
```

Local development has two modes: **hot-reload via Compose** (`deploy/docker-compose.yml` mounts `../` and runs `pnpm dev` inside containers) or **apps on the host** against `docker compose --file deploy/docker-compose.yml up -d postgres seaweedfs`. `docker compose --env-file .env --file deploy/docker-compose.yml --file deploy/docker-compose.production.yml up --build` verifies the production build. `pnpm seed` is mandatory before the first login: the admin is provisioned outside the product, so local/dev needs a way to create one.

**`--env-file .env` is required for the production stack.** The production
compose uses `${VAR}` without defaults (a missing value must not silently become
an empty password), and `env_file: ../.env` only injects variables *into* the
container — it does not feed `${VAR}` interpolation. Without `--env-file` the
interpolation resolves to empty strings and Postgres refuses to initialize.
The dev stack works without it because every value has a default.

Quality gates that will exist regardless of stack: **lint**, **typecheck**,
**unit/integration tests**, **end-to-end tests** and **build**. A PR is only
done when the affected suites plus lint and typecheck are green.

## Conventions

* **Language:** code, comments and identifiers in English; user-facing copy
  (validation messages, API error messages, emails, UI text) in Brazilian
  Portuguese for the users of the system
* **Comments:** full convention in
  [.agents/rules/comments.md](.agents/rules/comments.md) — comments explain
  only why/decisions, never what; no TODO/FIXME; no commented-out code
* **Clean Code:** full development and code-quality guidelines in
  [.agents/rules/clean-code.md](.agents/rules/clean-code.md) — naming,
  responsibilities, control flow, error handling, duplication, abstraction,
  testability and maintainability
* **UI changes:** every screen, flow or component is checked against the
  [Nielsen heuristics](.agents/rules/nielsen-heuristics.md) before merge
* **This file and .agents/ are in English**
* **Auth:** cookie `httpOnly` + `Secure` + `SameSite` — the token is **never**
  read by JavaScript, never kept in `localStorage` and never sent by the
  frontend on its own; CSRF covered by SameSite + server-side `Origin` check
  (plus a double-submit token on sensitive actions). Passwords hashed with
  argon2id. Access rules in
  [.agents/decisions/accounts-and-access.md](.agents/decisions/accounts-and-access.md)
  (email verification required, 5 accounts per IP, stricter limits on
  sensitive routes)
* **Roles:** `CREDITOR` and `ADMIN` (plus the un-authenticated visitor
  situation); the role is read from the server, never from the request body
* **Data access:** repositories only, through Prisma — no query in controllers,
  no query outside a repository in services
* **Uploads:** streamed through the backend to SeaweedFS, never buffered in
  memory and never written to a public path; 40 MB per file
  ([document storage](.agents/decisions/document-storage.md))
* **Document visibility:** `publico` / `privado` per document, with the full
  matrix in
  [.agents/decisions/document-visibility.md](.agents/decisions/document-visibility.md)
* **Document status:** `Em análise` (default on upload) → `Deferido` |
  `Indeferido`, changed only by ADMIN, no history kept
  ([decision](.agents/decisions/document-status.md))
* **Deletions:** permanent and confirmed. Removing a client or a case also
  removes its documents; removing a document removes the stored file. No soft
  delete, no trash, no restore
* **Emails:** verification, password reset and new-document notification are
  part of the product
  ([.agents/decisions/accounts-and-access.md](.agents/decisions/accounts-and-access.md),
  [document storage](.agents/decisions/document-storage.md))
* **Commits:** messages and PR titles in English, Conventional Commits (`feat:`,
  `fix:`, `chore:`, `test:`, `docs:`, `refactor:`); PR body in Portuguese or
  English (what changed, how to validate, checks run)
* **Branches:** `feat/`, `fix/`, `docs/`, `test/`, `chore:`, `refactor:` +
  short slug (e.g. `feat/document-visibility`)
* **Commit hygiene:** review `git status` / `git diff` before committing;
  never commit env files, secrets, judicial documents or generated artifacts

## Task flow

1. Understand the task — ask if anything is ambiguous
2. Create a specific branch with a descriptive name BEFORE any code change
   (never develop on main/develop; one task = one branch = one PR)
3. Study `docs/base-system-features.md` and the matching checklist in
   [.agents/rules/task-checklists.md](.agents/rules/task-checklists.md) before
   coding
4. Implement following best practices (DRY, SOLID where applicable, SRP, KISS,
   YAGNI, composition over inheritance, low coupling) and follow
   [.agents/rules/clean-code.md](.agents/rules/clean-code.md)
5. Update or create tests for the change; run lint and typecheck
6. Validate nothing broke (run the affected suites) — before push/PR, the
   affected suites plus lint and typecheck must be green
7. **Update this file / .agents/ if the task changed or added a decision**
8. Open a PR (what changed, how to validate, checklist: tests, lint, typecheck,
   docs) and request review before the next task

## How to work

* Act directly within the task scope; present a plan for approval first only
  for large changes (new module, destructive migration, change in the
  visibility or access rules, public contract)
* Chat in Portuguese: concise, with file paths/links and short test evidence
* Blocked (missing credential, ambiguous requirement, broken environment, or a
  missing stack decision)? Stop, describe the blocker and the options, and
  wait — never guess ahead
* "Done" requires short evidence (e.g. suite counts, lint ok), not bare claims
* Never treat the legacy system as code to be ported: it is **behavior
  reference only**. Copying its structure reproduces its known problems (see
  [Restrições](docs/base-system-features.md))

## Code standards

* Clear, descriptive names; self-explanatory code; small cohesive functions
* No magic numbers; explicit error handling (never swallow exceptions)
* Minimal changes: touch only what the task needs; suggest (don't implement)
  unrelated improvements
* Reuse first: check for an existing equivalent before creating files, classes
  or services
* Orthogonality: one authoritative home per logic (see
  [.agents/rules/architecture.md](.agents/rules/architecture.md)) — consume the
  shared package, specialize instead of forking, never a third copy
* No premature optimization, but no knowingly wasteful queries, loops or
  allocations
* No new libraries without need and justification; check the existing manifest
  first
* Public API/contract/behavior changes must be announced beforehand
* Follow [.agents/rules/clean-code.md](.agents/rules/clean-code.md) for detailed
  Clean Code practices and PR review criteria

## Security baseline

Full policies live in [.agents/security/](.agents/security/):

* [Personal data and judicial secrecy (LGPD)](.agents/security/personal-data-and-secrecy.md)
  — documents and creditor data are confidential by default; never log
  document contents, names or e-mails beyond what the feature requires
* [Rate limiting](.agents/security/rate-limiting.md) — global limit plus
  stricter limits on login, registration, verification resend and upload
* [Content Security Policy](.agents/security/content-security-policy.md) —
  one centralized configuration applied to every app
* [CI security pipeline](.agents/security/ci-pipeline.md) — audit, dependency
  review, secret scanning, CodeQL, security linting, container linting
* [Backups](.agents/security/backups.md) — daily database dump, 7-day
  retention, tested restore
* [Encryption at rest](.agents/security/encryption-at-rest-decision.md) —
  decision record

Per-task security checklists (new endpoint, migration, upload endpoint, change
in visibility rules, new email): [.agents/rules/task-checklists.md](.agents/rules/task-checklists.md).

## Never do

1. **Never** open `.env.prod`, `.env.staging` or any production environment file
2. **Never** print, log or persist secrets, credentials, tokens, personal data
   or judicial document contents beyond what the feature requires
3. **Never** run destructive commands (migrate reset, drop, mass delete) against
   staging/production data
4. **Do not** change secrets, infra config or CI/CD pipelines unless the task
   explicitly requires it
5. **Do not** remove existing security validations
6. **Do not** add unrequested features
7. **Do not** remove code without checking usages, impact and justification
8. **Do not** assume requirements — ask when ambiguous
9. **Do not** ignore errors — all handling must be explicit
10. **Never** push directly to main/develop — every change goes through a task
    branch + PR
11. **Never** push or open a PR with failing tests, lint or typecheck
12. **Never** run destructive commands (migrate reset, drop, mass delete,
    `rm -rf`) without prior confirmation — even locally
13. **Never** touch files outside the task scope ("drive-by" edits) —
    unrelated improvements go as text suggestions, never as code
14. **Never** use, repeat or persist secrets pasted in chat — redirect to the
    safe channel (GitHub Environments/secrets) instead
15. **Never** edit tests to make them pass — fix the source; test changes need
    an approved justification
16. **Never** make a document publicly accessible outside the visibility rules
    in [document-visibility.md](.agents/decisions/document-visibility.md), and
    never change those rules in a task that did not announce it
17. **Do not** invent stack, layout or commands that are not recorded here —
    while a section is TBD, stop and ask

## Product decisions

* [Document visibility](.agents/decisions/document-visibility.md) — public vs
  private, who sees what, 403 semantics, guest transparency layer
* [Document storage and upload](.agents/decisions/document-storage.md) — object
  storage, allowed formats, size limits, content identity, access delivery,
  deletion
* [Document status](.agents/decisions/document-status.md) — the three states,
  who changes them, batch save, absence of history
* [Accounts and access](.agents/decisions/accounts-and-access.md) — roles, email
  verification, per-IP account limit, admin provisioning, login throttling
* [Database](.agents/decisions/database.md) — least-privilege role, migrations
  with a privileged connection

## Deploy

Everything runs as **Docker Compose on one AWS Lightsail instance**; only the
reverse proxy is exposed to the internet.

* **Containers:** reverse proxy (the only published port), `frontend` (Next.js),
  `backend` (NestJS), `postgres`, `seaweedfs` (master + volume + filer + S3)
* **Local/staging:** `deploy/docker-compose.yml`; **production:**
  `deploy/docker-compose.production.yml`, stacks isolated by compose project `name`
* **One command per environment** for build/deploy/up, recorded here when the
  deploy pipeline is created
* **The instance is a single point of failure.** This is the reason backups
  must leave the machine (see [backups](.agents/security/backups.md)) — a dump
  kept in the same instance is not a backup
* **Never** run destructive commands against the production stack
  (see "Never do" 3 and 12)
