// Throttling limits — single home for every rate limit in the system

/**
 * Per-IP ceiling applied to every route, so static and health traffic is
 * covered too. Per .agents/security/rate-limiting.md.
 */
export const GLOBAL_LIMIT_PER_MINUTE = 100;

/** `POST /auth/login` — brute force on credentials. */
export const LOGIN_LIMIT_PER_MINUTE = 10;

/** `POST /auth/register` — mass account creation. */
export const REGISTER_LIMIT_PER_MINUTE = 5;

/** `POST /auth/verification-notification` — e-mail bombing. */
export const VERIFICATION_LIMIT_PER_MINUTE = 6;

/** `POST /auth/forgot-password` — e-mail bombing. */
export const FORGOT_PASSWORD_LIMIT_PER_MINUTE = 5;

/** `POST /documents` — bandwidth abuse and object-storage cost. */
export const UPLOAD_LIMIT_PER_MINUTE = 20;

/** `GET /documents/:id/content` — scraping of public documents. */
export const DOWNLOAD_LIMIT_PER_MINUTE = 60;

/**
 * Accounts allowed per source IP address. Not time-based: it survives restarts
 * and is evaluated before the account is created, so it is enforced against the
 * database rather than by the throttler.
 */
export const MAX_ACCOUNTS_PER_IP = 2;

export const ONE_MINUTE_IN_MS = 60_000;

/** Shown whenever a limit is hit. Tells the user what to do, per the decision. */
export const THROTTLED_MESSAGE =
  'Muitas tentativas. Por favor, aguarde antes de tentar novamente.';
