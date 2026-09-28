// Document repository — the only place that touches documents

import { Injectable } from '@nestjs/common';
import type { Document, DocumentStatus, DocumentType, DocumentVisibility, Prisma } from '@prisma/client';
import { QueryClient } from '../../prisma/query-client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateDocumentData {
  companyId: string;
  ownerId: string;
  name: string;
  description: string | null;
  type: DocumentType;
  customType: string | null;
  visibility: DocumentVisibility;
  storageKey: string;
  size: number;
  mimeType: string;
  extension: string;
  contentHash: string;
}

export type DocumentWithOwner = Document & { owner: { id: string; name: string; role: string } };

export type DocumentWithOwnerAndCompany = DocumentWithOwner & {
  company: { id: string; name: string };
};

const OWNER_SELECT = { select: { id: true, name: true, role: true } };

/** Every data access for documents; the service owns rules, never queries. */
@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDocumentData, client: QueryClient = this.prisma): Promise<Document> {
    return client.document.create({ data });
  }

  async findById(id: string): Promise<DocumentWithOwner | null> {
    return this.prisma.document.findUnique({ where: { id }, include: { owner: OWNER_SELECT } });
  }

  async delete(id: string, client: QueryClient = this.prisma): Promise<void> {
    await client.document.delete({ where: { id } });
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<DocumentWithOwner> {
    return this.prisma.document.update({
      where: { id },
      data: { status },
      include: { owner: OWNER_SELECT },
    });
  }

  async updateVisibility(id: string, visibility: DocumentVisibility): Promise<DocumentWithOwner> {
    return this.prisma.document.update({
      where: { id },
      data: { visibility },
      include: { owner: OWNER_SELECT },
    });
  }

  /** One page of a single owner's documents, newest first. */
  async findByOwner(ownerId: string, take: number, skip: number): Promise<DocumentWithOwnerAndCompany[]> {
    return this.prisma.document.findMany({
      where: { ownerId },
      include: { owner: OWNER_SELECT, company: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.prisma.document.count({ where: { ownerId } });
  }

  /** Real totals per status across all of the owner's documents. */
  async statsByOwner(ownerId: string): Promise<Record<DocumentStatus, number>> {
    const groups = await this.prisma.document.groupBy({
      by: ['status'],
      where: { ownerId },
      _count: { status: true },
    });
    const stats: Record<DocumentStatus, number> = {
      EM_ANALISE: 0,
      DEFERIDO: 0,
      INDEFERIDO: 0,
    };
    for (const group of groups) {
      stats[group.status] = group._count.status;
    }
    return stats;
  }

  /** Every stored key of an owner — the cascade inventory for deletion. */
  async storageKeysByOwner(ownerId: string): Promise<string[]> {
    const rows = await this.prisma.document.findMany({
      where: { ownerId },
      select: { storageKey: true },
    });
    return rows.map((row) => row.storageKey);
  }

  /** Distinct companies an owner has documents in, alphabetical. */
  async companiesByOwner(ownerId: string): Promise<Array<{ id: string; name: string; nature: string }>> {
    const rows = await this.prisma.document.findMany({
      where: { ownerId },
      distinct: ['companyId'],
      select: { company: { select: { id: true, name: true, nature: true } } },
      orderBy: { company: { name: 'asc' } },
    });
    return rows.map((row) => ({
      id: row.company.id,
      name: row.company.name,
      nature: row.company.nature,
    }));
  }

  /**
   * Filters the company's documents to what the viewer may read, in the query
   * itself — rows the caller cannot see are never loaded. Mirrors
   * canReadDocument; the two are covered by the same matrix tests.
   */
  async findVisible(
    companyId: string,
    viewer: { id: string; role: string } | undefined,
    scope: 'all' | 'mine' | 'admin',
  ): Promise<DocumentWithOwner[]> {
    if (!viewer) {
      return this.list({ companyId, visibility: 'PUBLICO' });
    }

    if (viewer.role === 'ADMIN') {
      return this.list({ companyId });
    }

    if (scope === 'mine') {
      return this.list({ companyId, ownerId: viewer.id });
    }

    if (scope === 'admin') {
      return this.list({ companyId, owner: { role: 'ADMIN' } });
    }

    return this.list({
      companyId,
      OR: [
        { visibility: 'PUBLICO' as DocumentVisibility },
        { ownerId: viewer.id },
        { owner: { role: 'ADMIN' } },
      ],
    });
  }

  private async list(where: Prisma.DocumentWhereInput): Promise<DocumentWithOwner[]> {
    return this.prisma.document.findMany({
      where,
      include: { owner: OWNER_SELECT },
      orderBy: { createdAt: 'desc' },
    });
  }
}
