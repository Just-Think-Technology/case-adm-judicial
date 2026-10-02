// User repository — the only place that touches the users table

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { QueryClient } from '../../prisma/query-client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  registrationIp: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  emailVerified: boolean;
  registrationIp: string | null;
  createdAt: Date;
}

/** Data access for accounts. Auth flows read through here, never Prisma directly. */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<UserRow | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserData, client: QueryClient = this.prisma): Promise<UserRow> {
    return client.user.create({ data });
  }

  async markVerified(id: string, client: QueryClient = this.prisma): Promise<void> {
    await client.user.update({
      where: { id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });
  }

  async updatePassword(id: string, passwordHash: string, client: QueryClient = this.prisma): Promise<void> {
    await client.user.update({ where: { id }, data: { passwordHash } });
  }

  async updateProfile(
    id: string,
    data: { name?: string; email?: string; emailVerified?: boolean; emailVerifiedAt?: Date | null },
    client: QueryClient = this.prisma,
  ): Promise<UserRow> {
    return client.user.update({ where: { id }, data });
  }

  async deleteById(id: string, client: QueryClient = this.prisma): Promise<void> {
    await client.user.delete({ where: { id } });
  }

  /**
   * The admin clients tab: every account, alphabetical, with optional text
   * and company filters. The company filter keeps accounts holding documents
   * in a matching company.
   */
  async findClients(filters: {
    search?: string;
    company?: string;
    take: number;
    skip: number;
  }): Promise<UserRow[]> {
    return this.prisma.user.findMany({
      where: this.clientFilters(filters),
      orderBy: { name: 'asc' },
      take: filters.take,
      skip: filters.skip,
    });
  }

  async countClients(filters: { search?: string; company?: string }): Promise<number> {
    return this.prisma.user.count({ where: this.clientFilters(filters) });
  }

  private clientFilters(filters: { search?: string; company?: string }): Prisma.UserWhereInput {
    return {
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.company
        ? {
            documents: {
              some: { company: { name: { contains: filters.company, mode: 'insensitive' } } },
            },
          }
        : {}),
    };
  }
}
