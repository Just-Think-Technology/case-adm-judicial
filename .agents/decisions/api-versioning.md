# API Versioning

- **Status:** Accepted — inherited from the previous project
- **Scope:** NestJS backend, the reverse proxy (Caddy) and the Next.js frontend

## Context

The portal has three kinds of clients: the web frontend, e-mail links (verify /
reset password) and the judicial administration team using the same screens.
Any change to a request or response contract must be evolvable without breaking
a screen already open in a creditor's browser.

## Decision

- **URL versioning:** the current version is `v1`, exposed as `/api/v1/*`.
- **Backend:** the NestJS app sets a global prefix `api/v1`, **excluding the
  health endpoints** (`health`). Controllers stay unprefixed — the prefix is a
  routing concern, not a controller concern. The global exception filter and
  the Swagger decorator see the same paths.
- **Gateway:** Caddy routes `/api/v1/*` to the backend unchanged, and
  `/api/v1/storage/*` to the SeaweedFS S3 gateway with the prefix stripped
  (SeaweedFS expects `<bucket>/<object>`, no `/api` prefix). `Host` must be
  preserved: the S3 SigV4 signature includes the host, so a rewritten host
  invalidates presigned URLs.
- **No legacy/unversioned prefix exists.** This system starts clean: there is
  nothing to deprecate and no `Deprecation`/`Sunset` header to carry.
- **Frontend:** a single API client module holds the prefix
  (`API_PREFIX = '/api/v1'`); no screen hard-codes an `/api` path.
- **URL is the authoritative version.** Content-negotiation headers
  (`Accept: application/vnd...`) are reserved and not negotiated yet.

## Deprecation policy

- **Non-breaking changes** (added fields, new optional query parameters, new
  endpoints) stay on `v1`.
- **Breaking changes** (removed/renamed fields, changed auth, changed
  visibility semantics) require `/api/v2/*` — a new global prefix in the backend
  and a new `handle /api/v2/*` in Caddy. `v1` is kept for at least one full
  release after `v2` ships.
- A breaking change is always **announced beforehand** and the announcement
  names the migration path for each consumer.

## Health checks

Health endpoints are **excluded from the version prefix**: `/health` answers
directly on the container, so probes work with or without the proxy.

## Alternatives considered

- **Header-only versioning** (`Accept` / `X-API-Version`) — rejected: harder to
  route at the edge, invisible in logs, needs custom middleware.
- **No versioning, breaking changes in place** — rejected: no safe evolution.
- **Per-module versions** — rejected: operational complexity for one contract.

## Consequences

- Every integration test, e2e test and frontend client call `/api/v1/*`; direct
  container probes use `/health`.
- Swagger/API docs stay **unversioned** and are not exposed in production.
- `v2` is additive: a new prefix, no database migration.
- Changing the prefix or this policy updates this file and
  [AGENTS.md](../../AGENTS.md) in the same PR.
