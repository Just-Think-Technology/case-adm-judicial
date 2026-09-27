// Security headers — the one CSP policy the backend applies to every response

import type { HelmetOptions } from 'helmet';

/**
 * Directive set from .agents/security/content-security-policy.md. This is the
 * decision transcribed to code: a route, controller or page may not define its
 * own headers, and a change here is the change to that document.
 *
 * `script-src` carries no `unsafe-inline` and no `unsafe-eval`. `style-src` is the
 * single exception, because Swagger UI and error pages render inline styles; it is
 * scoped to a style source and does not weaken script execution.
 */
const CONTENT_SECURITY_POLICY_DIRECTIVES = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  scriptSrc: ["'self'"],
  // Inline styles are required by Swagger UI and by the error templates; the
  // decision forbids unsafe-inline in script-src, which is what actually
  // executes code.
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'blob:'],
  // Documents are delivered through the gateway, never from a third-party host
  connectSrc: ["'self'"],
  mediaSrc: ["'self'"],
  fontSrc: ["'self'", 'data:'],
  workerSrc: ["'self'", 'blob:'],
  manifestSrc: ["'self'"],
};

/** One year, subdomains included, preloadable. */
const HSTS_MAX_AGE_IN_SECONDS = 31_536_000;

/**
 * Builds the Helmet configuration for the whole application.
 *
 * HSTS is applied only outside development: sending it over plain HTTP to
 * `localhost` makes the browser refuse the origin for a year, which breaks the
 * dev loop with no production benefit.
 *
 * @param isProduction - True when serving staging or production traffic
 * @returns The Helmet options to hand to `app.use()`
 */
export function getSecurityHeaders(isProduction: boolean): HelmetOptions {
  return {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: CONTENT_SECURITY_POLICY_DIRECTIVES,
    },
    // Deny outright, matching frame-ancestors 'none' — the Helmet default is
    // SAMEORIGIN, which still allows embedding from the same site
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    crossOriginEmbedderPolicy: false,
    // Helmet enables HSTS by default, so development has to switch it off
    // explicitly — omitting the option would keep the default and the browser
    // would refuse plain-HTTP localhost for a year
    strictTransportSecurity: isProduction
      ? {
          maxAge: HSTS_MAX_AGE_IN_SECONDS,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  };
}
