# Frontend BFF convention

The browser never calls the NestJS API directly. All browser traffic goes to
same-origin Next.js route handlers under `/bff/*`, which forward to the
backend (status + body preserved) and pass the session cookie through.

## Rules

- `/api/*` belongs to the gateway (Caddy → backend). BFF handlers live under
  `/bff/*` so the two never collide in production or in `next.config` rewrites.
- Handlers are explicit per resource (`/bff/companies`, `/bff/documents/:id/content`),
  never a generic catch-all proxy — each one is a deliberate hole in the wall.
- `frontend/lib/backend.ts` is the single server-side gateway
  (`BACKEND_INTERNAL_URL`, default `http://localhost:3000`, set to
  `http://backend:3000` in compose). Server Components use it directly; only
  browser-initiated traffic goes through `/bff/*` over HTTP.
- File downloads stream through `/bff/documents/:id/content`, preserving the
  backend's content headers (inline/attachment decision stays server-side).
- Backend outages surface as Portuguese 502s from the BFF and friendly
  in-page messages — never stacks or empty shells.

## Client IP and throttles

The BFF forwards the incoming `X-Forwarded-For` verbatim (Caddy supplies the
real client IP; in direct dev access it is absent and the backend sees
`unknown`). This keeps the per-IP account limit working through the proxy.
Login needs nothing extra: its budget is already per account + tracker
(`buildLoginThrottleKey`), a design that assumed NAT and covers the BFF's
single egress IP the same way. CSRF rides along as the `x-csrf-token` header
next to the cookies — the double-submit check never leaves the backend.
