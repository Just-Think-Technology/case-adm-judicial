// Company repository — the only place that touches companies

import { Injectable } from '@nestjs/common';
import type { CaseNature, Company } from '@prisma/client';
import { QueryClient } from '../../prisma/query-client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateCompanyData {
  name: string;
  judicialAdmin: string;
  judge: string;
  nature: CaseNature;
  processNumber: string;
  protocolDate: Date;
  author: string;
  comarca: string;
  observations: string;
}

export interface CompanyFilters {
  nature?: CaseNature;
  search?: string;
}

/** Every data access for companies; the service owns rules, never queries. */
@Injectable()
export class CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCompanyData, client: QueryClient = this.prisma): Promise<Company> {
    return client.company.create({ data });
  }

  async findAll(filters: CompanyFilters): Promise<Company[]> {
    return this.prisma.company.findMany({
      where: {
        ...(filters.nature ? { nature: filters.nature } : {}),
        ...(filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { processNumber: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Company | null> {
    return this.prisma.company.findUnique({ where: { id } });
  }

  async update(id: string, data: CreateCompanyData): Promise<Company> {
    return this.prisma.company.update({ where: { id }, data });
  }

  async delete(id: string, client: QueryClient = this.prisma): Promise<void> {
    await client.company.delete({ where: { id } });
  }
}
