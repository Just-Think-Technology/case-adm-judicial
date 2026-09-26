# Content Security Policy

- **Status:** Accepted — carried over from the previous project
- **Implementation:** `getSecurityHeaders()` in the backend shared module
  (Helmet) + the `headers()` config in `next.config.js`

Two **centralized** configurations — one in the backend, one in the frontend —
applied to **every** app. No route, controller or page may define its own
security headers.

## Policy

- `default-src 'self'`
- `frame-ancestors 'none'` and `X-Frame-Options: DENY` — no clickjacking
- `object-src 'none'`
- `script-src` / `style-src` allow `'unsafe-inline'` **only** where Next.js
  strictly requires it (hydration payload / inline styles), documented inline
  with a comment explaining why; never globally
- `connect-src` allows only the gateway origin; `img-src` and `media-src` allow
  the storage host
- HSTS: 1 year, `includeSubDomains`, preload — enabled only in staging/production
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`

## Documents and user content

- Uploaded documents are **never** served inline as HTML from the application
  origin. PDF and images are delivered as files/attachments with the correct
  content type and `nosniff`; DOCX/XLSX are always downloads
  ([document storage](../decisions/document-storage.md)).
- The **file name shown to the user is escaped** everywhere it is rendered (UI
  and e-mail) — document names are user input.

## Rules

- A new page, route or third-party script (fonts, analytics, CDN) is added only
  with an update to this file in the same PR.
- `unsafe-eval` and `unsafe-inline` in `script-src` are **not** accepted; a need
  for them is a signal to change the approach, not to relax the policy.
