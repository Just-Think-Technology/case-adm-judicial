// E-mail token repository — the only place that touches email_tokens

import { Injectable } from '@nestjs/common';
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

  async create(data: CreateEmailTokenData): Promise<EmailTokenRow> {
    return this.prisma.emailToken.create({ data });
  }

  async findValidByHash(tokenHash: string, type: string): Promise<EmailTokenRow | null> {
    return this.prisma.emailToken.findFirst({
      where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailToken.update({ where: { id }, data: { usedAt: new Date() } });
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
