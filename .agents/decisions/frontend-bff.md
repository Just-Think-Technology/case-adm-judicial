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

## Open point (auth slice)

IP-keyed throttles (e.g. login attempts) see the frontend container's IP, not
the visitor's, once the browser goes through the BFF. The auth slice must
decide how the real client IP reaches the backend throttle key (forwarded
header in the internal trust domain, or per-IP limiting at the BFF) before
wiring login through `/bff/*`.
