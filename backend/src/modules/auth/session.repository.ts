// Session repository — the only place that touches the sessions table

import { Injectable } from '@nestjs/common';
import { QueryClient } from '../../prisma/query-client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  userAgent?: string;
  expiresAt: Date;
}

export interface SessionRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

/**
 * Data access for refresh sessions. Used rows are revoked, never deleted: a
 * presented revoked token is the reuse signal that revokes everything.
 */
@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSessionData, client: QueryClient = this.prisma): Promise<SessionRow> {
    return client.session.create({ data });
  }

  async findByHash(tokenHash: string): Promise<SessionRow | null> {
    return this.prisma.session.findUnique({ where: { tokenHash } });
  }

  async findById(id: string): Promise<SessionRow | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async revokeById(id: string, client: QueryClient = this.prisma): Promise<void> {
    await client.session.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAll(userId: string, client: QueryClient = this.prisma): Promise<void> {
    await client.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
