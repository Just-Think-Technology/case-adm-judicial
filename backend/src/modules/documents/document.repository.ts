// Document repository — the only place that touches documents

import { Injectable } from '@nestjs/common';
import type { Document, DocumentType, DocumentVisibility, Prisma } from '@prisma/client';
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
