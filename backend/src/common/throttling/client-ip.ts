// Client IP resolution — single home for reading the caller's address

/**
 * Extracts the caller's IP address from a request.
 *
 * Every request reaches the backend through Caddy, so the socket address is the
 * proxy's own container IP. The real address arrives in `X-Forwarded-For` — and
 * only there because Caddy strips any client-supplied value before proxying
 * (see `header_up -X-Forwarded-For` in deploy/Caddyfile), then appends the real
 * client IP. The left-most entry is therefore the original client. Direct
 * access bypassing the proxy would break this assumption; nothing but the
 * proxy is published (see deploy/docker-compose.production.yml).
 *
 * @param req - The incoming request
 * @returns The client IP, or undefined when the request carries no usable address
 */
export function resolveClientIp(req: Record<string, unknown>): string | undefined {
  const headers = req.headers as Record<string, string | string[] | undefined> | undefined;
  const forwarded = headers?.['x-forwarded-for'];

  const raw =
    typeof forwarded === 'string'
      ? forwarded
      : Array.isArray(forwarded)
        ? forwarded[0]
        : undefined;

  if (typeof raw !== 'string' || raw.trim() === '') {
    return undefined;
  }

  const [first] = raw.split(',');
  const ip = first?.trim();

  return ip === '' ? undefined : ip;
}
