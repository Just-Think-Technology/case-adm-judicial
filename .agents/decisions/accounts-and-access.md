# Accounts and Access

- **Status:** Accepted — inherited from the functional contract
  ([docs/base-system-features.md §2, §4.2–4.4, §6.3, §6.5](../../docs/base-system-features.md));
  session mechanism decided as **hybrid (option A)** on 2026-09-25
- **Stack:** NestJS + Next.js, session carried in an `httpOnly` cookie —
  a short-lived **signed access token** plus a **rotating refresh token stored
  server-side**

## Roles

| Role | Meaning |
|---|---|
| **VISITOR** | Not authenticated — a usage situation, not an account type |
| **CREDITOR** | Authenticated + verified account |
| **ADMIN** | Authenticated + verified + admin flag |

## Admin provisioning

- **Admin is never granted inside the product.** There is no promotion screen,
  no invite, no role editor and no "first user becomes admin" rule.
- Granting the admin flag happens outside the product (operations run directly
  on the database, by the office), and is therefore an **audited, announced**
  operation.
- An admin account **cannot be deleted** by the product, and an admin cannot
  delete their own account.
- There is no self-service deletion of any account.

## Email verification

- Registration creates the account **unverified** and sends a verification
  e-mail. Registration does **not** log the user in.
- **An unverified account cannot log in**: the attempt is refused, the session
  is closed and the user is sent back to the login screen with the option to
  **resend** the verification e-mail.
- The verification link is **single-purpose and expiring**; an invalid or
  tampered link reports an invalid link, it does not verify anything.
- Resend has two limits: a **cooldown of 5 minutes per user** and a **global
  request rate limit** (see [rate limiting](../security/rate-limiting.md)).
- E-mail addresses that are unknown **or already verified** get the same
  non-revealing message — the resend form never discloses whether an account
  exists.

## Registration limits

- **Maximum of 5 accounts per source IP address.** The address used at
  registration is stored for this purpose only.
- Exceeding the limit blocks the registration with a clear message; it does not
  silently drop the account.
- The check is server-side and evaluated before the account is created.

## Profile changes

- A user may change their own **name**, **e-mail** and **password**, and nothing
  else — there is no self-service profile for another user.
- **Name:** 5–20 characters, letters only (accents allowed).
- **E-mail:** valid, **unique** in the system, stored lowercase.
- **Password:** minimum 8 characters with at least one uppercase letter, one
  lowercase letter, one digit and one special character; confirmation must
  match.
- **Changing the e-mail does not re-trigger verification** (current behavior;
  see [Restrições](../../docs/base-system-features.md)
  item 9). Revisit as a new decision record if verification is re-enabled.
- **Changing the password requires the current password**, rejects reuse of the
  current password, and **invalidates sessions on other devices**.

## Sessions

**Decision: hybrid.** A short-lived signed access token for the hot path, plus
a server-side rotating refresh token for continuity and revocation.

### Tokens

| Token | Form | Lifetime | Stored |
|---|---|---|---|
| **Access** | Signed JWT (HS256/RS256), claims: `sub`, `role`, `emailVerified`, `exp` | **15 minutes** | Not stored — verified by signature |
| **Refresh** | 256-bit random opaque string | **7 days**, rotating | **Hashed** (SHA-256) in the `sessions` table |

- The refresh token is stored **hashed**: a database leak must not hand over
  working sessions.
- A `sessions` row carries: token hash, user id, created at, last used at,
  expires at, revoked at and user agent. No document or case data.
- Every refresh **rotates**: the used row is revoked and a new one is issued.
- **Reuse detection:** presenting an already-used or revoked refresh token is
  treated as theft — **all** sessions of that user are revoked.

### Cookies

- `access_token` — `httpOnly`, `Secure`, `SameSite=Lax`, short `max-age`.
- `refresh_token` — `httpOnly`, `Secure`, `SameSite=Strict`, **`Path` scoped to
  the refresh route only**, so it is not attached to ordinary requests.
- JavaScript **never reads either cookie**; the frontend never writes them and
  never builds an `Authorization` header of its own. The Next.js server
  components forward the cookie to the backend, which is the only authority on
  the session.

### CSRF

Because the session rides on a cookie, every state-changing request is checked
for: `SameSite` + **server-side `Origin` validation** + a **double-submit token**
on the sensitive actions (login, password change, profile change, visibility
change, delete, bulk status save).

### Revocation

| Action | Effect |
|---|---|
| Logout | Revokes the current session's refresh row |
| Change / reset password | Revokes **all other sessions** of that user, keeping the current one |
| Refresh token reuse | Revokes every session of that user |
| Admin flag removed out-of-band | Effective within one access-token lifetime (≤ 15 min) |

The last row is the known cost of signing the access token: anything that must
take effect **immediately** re-reads the session from the server instead of
trusting the claim.

### Expired access token

The server-side frontend calls the refresh route **once** and retries the
original request. If the refresh fails, the session is over: the user goes to
the login screen. There is no silent retry loop and no client-side token
storage.

### Keys

- Signing keys and the refresh-token secret come from the environment/secret
  store, **never committed**. Rotation of the access key keeps the previous key
  accepted until the tokens it signed expire (≤ 15 min).

### Alternatives considered

- **Opaque session (one database row per request)** — rejected for now: a
  query on every request buys nothing at this scale (one instance, local
  PostgreSQL). Revisit if the backend is ever scaled horizontally.
- **Fully stateless JWT** — rejected: it cannot end other sessions on a
  password change nor reflect an out-of-band admin flag, both required by the
  functional contract.

## Consequences

- Role and verification state are read from the session on the **server**; the
  client cannot escalate by sending a different role.
- Every admin-only surface checks the role once, in a shared guard/policy, not
  per screen (see [architecture](../rules/architecture.md)).
- **Password hashing:** argon2id (parameters recorded here when the auth module
  is created; a change in cost is an announced decision, not a silent tweak).
- The `sessions` table is **personal data** (user agent, activity) and follows
  the retention rule in
  [personal data](../security/personal-data-and-secrecy.md): expired and revoked
  rows are purged on a schedule.
- There is **no notification to the creditor when a status changes** — the
  creditor sees the decision by reopening the case. Introducing a notification is
  a new feature request, not a bug fix.
