# CI Security Pipeline

- **Status:** Accepted — inherited from the previous project
- **Workflow files:** `.github/workflows/`, split per app
  (`ci-backend.yml`, `ci-frontend.yml`, `ci-security.yml`)

## Jobs

A consolidated summary fails the pipeline if any job fails.

**Backend** (`ci-backend.yml`): `changes, quick, e2e, security, build, image,
codeql, dependency-review`

**Frontend** (`ci-frontend.yml`): `changes, quick, deep, security, image, codeql,
dependency-review`

**Shared** (`ci-security.yml`): `secret-scan, docker-lint, compose-validate`

## Gates

- **Dependency audit** in the package manager, failing on `high`/`critical`
  (backend + frontend), run in `security`.
- **Dependency review** action on PRs — a new dependency is an explicit review,
  never an automatic merge.
- **Transitive floor:** `pnpm-workspace.yaml` `overrides` hold patched lines
  for transitives whose pinned parents lag (mysql2/deepmerge-ts via Prisma);
  revisit when the parents move. Pinned Actions stay fresh via Dependabot
  (`.github/dependabot.yml`) — every `uses:` is a full SHA with a version
  comment.
- **Secret scanning:** TruffleHog, `--only-verified --fail`.
- **Static analysis:** CodeQL with `security-extended` + `security-and-quality`
  for TypeScript/JavaScript, in both apps.
- **Security linting:** the security ruleset is enabled in the project linter
  and runs inside `quick` (not as an optional separate step).
- **Container linting:** Hadolint on every `Dockerfile`.
- **Compose validation:** `docker compose config` on both compose files — a
  typo in a production service is a deploy-time failure otherwise.
- **CI is a release gate, not a report:** a red gate blocks merge.

## TDD red → green

- `quick` runs lint + typecheck + tests; a failing test **blocks merge** — the
  green state is CI-enforced.
- The **red commit** (a failing test before the implementation) is
  **review-enforced**: [task-checklists.md](../rules/task-checklists.md) requires
  a proof commit before the green commit. Reviewers check the commit sequence;
  CI would have failed if the red commit were pushed alone — that is the
  intended signal.
- Optional local script asserting the sequence (first test-only commit precedes
  the first implementation commit) can be added as a non-blocking step.

## Secrets in CI

- Secrets come from **GitHub Environments/secrets**, never from a pasted value
  and never from a committed `.env`.
- Job logs never print `.env` contents, database credentials or storage
  credentials.

## Never in CI

- Never upload a real document or real personal data as a fixture — test data
  is always synthetic and obviously fake. CI test data comes from a disposable
  database, never from a production dump.
