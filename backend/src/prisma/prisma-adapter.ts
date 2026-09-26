// Prisma driver adapter — single home for the runtime database connection

import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Builds the PostgreSQL driver adapter used by every runtime Prisma client.
 *
 * Prisma 7 delegates connections to a driver adapter instead of bundling an
 * engine, so a client without one refuses to connect. Runtime clients use the
 * least-privilege application role (`DATABASE_URL`); migrations use the
 * separate privileged role (`DIRECT_URL`) through prisma.config.ts.
 *
 * @returns The adapter bound to the application connection string
 * @throws {Error} If `DATABASE_URL` is missing, instead of failing later with an opaque Prisma error
 */
export function createPrismaAdapter(): PrismaPg {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — the application cannot connect to the database');
  }

  return new PrismaPg({ connectionString });
}
