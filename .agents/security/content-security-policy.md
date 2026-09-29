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
- `script-src` and `style-src` allow `'unsafe-inline'` **only** where Next.js
  strictly requires it (hydration payload / inline styles), documented inline
  with a comment explaining why; never globally
- `connect-src` allows only the gateway origin; `img-src` and `media-src` allow
  the storage host
- HSTS: 1 year, `includeSubDomains`, preload — enabled only in staging/production
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy` denies what the product never uses — `camera=()`,
  `microphone=()`, `geolocation=()`, `payment=()`. The system shows documents
  and redirects to the gateway; it needs none of these capabilities
- Cross-Origin-Embedder-Policy is **off** on the backend. COEP `require-corp`
  constrains documents that load subresources; the backend serves JSON, not
  documents, so the header would add no protection and one more thing to debug
  in development

### The `'unsafe-inline'` exception is settled, not pending

Next.js emits the hydration bootstrap as an **inline script**. Blocking it does
not degrade the page, it breaks it: React throws error #412 and client-side
navigation dies. Verified against a production build, not assumed.

So the frontend `script-src` is `'self' 'unsafe-inline'`, with the reason written
inline in `frontend/next.config.ts`. The backend keeps `script-src 'self'` — it
serves JSON and Swagger, never an application document, so it has no reason to
relax.

The stricter alternative is a **per-request nonce**, which Next supports natively
via the `nonce` prop. It was not chosen because a nonce only exists per request,
so every page would have to be dynamic and static generation would be given up
for the whole frontend. Revisit if the frontend ever needs to be fully static
*and* free of `unsafe-inline` — those two cannot both hold.

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
- `unsafe-eval` is accepted **only in `next dev`**, never in production: React's
  development build reconstructs call stacks with `eval()`, and without it every
  page logs a console error. The production build never evaluates, so the shipped
  policy stays without it — localhost dev is not a security boundary, and the
  flag is keyed on `NODE_ENV === 'production'` in `next.config.ts` (verified:
  dev header carries it with zero console errors, prod header does not).
- `unsafe-inline` in `script-src` is accepted **only** on the frontend, and only
  for the Next.js hydration payload, per the settled exception above. The backend
  never gets it. Adding a second reason means either dropping the exception or
  moving to nonces — not appending to the list.
- Anything that widens the policy needs the trade-off written down here, not just
  a comment in code.
