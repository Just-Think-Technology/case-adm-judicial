import type { NextConfig } from 'next';

/**
 * Same policy as the backend's `getSecurityHeaders()`, applied to every frontend
 * response — the two halves of .agents/security/content-security-policy.md. A
 * page may not define its own headers.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // 'unsafe-inline' in script-src is the documented exception the decision
  // allows: Next.js emits the hydration bootstrap as an inline script, and
  // blocking it throws React #412 and kills client-side navigation — verified
  // in a production build. Removing it requires per-request nonces, which
  // forces every page to be dynamic and gives up static generation.
  // 'unsafe-eval' joins it in development only: React's dev build reconstructs
  // call stacks with eval(), and the production build never does — so prod
  // keeps the strict policy while `next dev` stays error-free.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"}`,
  // Inline styles are needed for the same reason: Next injects style tags.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    // The system shows documents and redirects to the gateway; it needs no
    // camera, microphone, geolocation or payment access.
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

const nextConfig: NextConfig = {
  // Backend is source of truth — frontend never talks to DB/storage directly
  // Enables the forbidden() + forbidden.tsx convention for the branded 403.
  experimental: {
    authInterrupts: true,
  },
  async rewrites() {
    return [
      // In local dev without Caddy, proxy /api to backend directly — the
      // prefix is stripped like the gateway does, controllers are prefix-less.
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*',
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
