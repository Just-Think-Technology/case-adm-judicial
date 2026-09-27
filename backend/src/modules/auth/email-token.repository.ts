// E-mail token repository — the only place that touches email_tokens

import { Injectable } from '@nestjs/common';
import { QueryClient } from '../../prisma/query-client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateEmailTokenData {
  userId: string;
  tokenHash: string;
  type: string;
  expiresAt: Date;
}

export interface EmailTokenRow {
  id: string;
  userId: string;
  tokenHash: string;
  type: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/** Single-use expiring tokens for verification and password reset. */
@Injectable()
export class EmailTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEmailTokenData, client: QueryClient = this.prisma): Promise<EmailTokenRow> {
    return client.emailToken.create({ data });
  }

  async findValidByHash(tokenHash: string, type: string): Promise<EmailTokenRow | null> {
    return this.prisma.emailToken.findFirst({
      where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  /**
   * Burns a token, but only while it is still unused.
   *
   * The condition is the whole point: two parallel clicks on the same link reach
   * this point with the same `usedAt = null` snapshot, and a plain update would
   * let both succeed. The conditional update takes the row lock and lets exactly
   * one of them through, which is what makes "single-use" true rather than
   * merely intended.
   */
  async consume(id: string, client: QueryClient = this.prisma): Promise<boolean> {
    const consumed = await client.emailToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });

    return consumed.count === 1;
  }

  async latestSentAt(userId: string, type: string): Promise<Date | null> {
    const latest = await this.prisma.emailToken.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return latest?.createdAt ?? null;
  }
}
