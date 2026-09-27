// Query client — shared client or transaction client

import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

/**
 * Anything able to run a query. Repositories accept one so a service can span
 * several repositories in a single transaction; when omitted, the repository
 * falls back to the shared client.
 *
 * The type lives next to Prisma because it is the ORM's own surface — the
 * service layer only ever passes the client through, it never writes queries.
 */
export type QueryClient = Prisma.TransactionClient | PrismaService;
