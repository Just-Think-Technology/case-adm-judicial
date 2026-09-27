// Companies service — cases CRUD and the public panel listing

import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import type { Company } from '@prisma/client';
import { StorageService } from '../../common/storage/storage.service';
import { CompanyDto } from './dto/company.dto';
import { InvalidNatureError, normalizeNature } from './company-nature';
import { CompanyRepository } from './company.repository';

/** A company the panel renders: no internal fields, nature in PT-BR. */
export interface CompanyCard {
  id: string;
  name: string;
  nature: string;
  processNumber: string;
  createdAt: Date;
}

/** The full case file, nature in PT-BR and the protocol as a calendar date. */
export interface CompanyDetails extends CompanyCard {
  judicialAdmin: string;
  judge: string;
  protocolDate: string;
  author: string;
  comarca: string;
  observations: string | null;
  updatedAt: Date;
}

const NATURE_LABELS = {
  RECUPERACAO_JUDICIAL: 'Recuperação Judicial',
  FALENCIA: 'Falência',
} as const;

/** Thrown when no company answers to the id. */
export class CompanyNotFoundError extends NotFoundException {
  constructor() {
    super('Empresa não encontrada.');
    this.name = 'CompanyNotFoundError';
  }
}

/** Thrown when the stored objects cannot be removed — the row is kept. */
export class CompanyStorageError extends InternalServerErrorException {
  constructor() {
    super('Não foi possível concluir a exclusão. Tente novamente.');
    this.name = 'CompanyStorageError';
  }
}

/**
 * Owns the companies domain. Authorization lives in guards (listing and detail
 * are public, mutations are ADMIN-only) — the service executes the contract's
 * §4.8, never invents policy.
 */
@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly companies: CompanyRepository,
    private readonly storage: StorageService,
  ) {}

  async list(nature?: string, search?: string): Promise<CompanyCard[]> {
    const rows = await this.companies.findAll({
      ...(nature ? { nature: this.parseNature(nature) } : {}),
      ...(search ? { search } : {}),
    });

    return rows.map(toCard);
  }

  async get(id: string): Promise<CompanyDetails> {
    return toDetails(await this.require(id));
  }

  async create(input: CompanyDto): Promise<CompanyDetails> {
    const row = await this.companies.create({
      name: input.name,
      judicialAdmin: input.judicialAdmin,
      judge: input.judge,
      nature: this.parseNature(input.nature),
      processNumber: input.processNumber,
      protocolDate: new Date(input.protocolDate),
      author: input.author,
      comarca: input.comarca,
      observations: input.observations,
    });

    return toDetails(row);
  }

  async replace(id: string, input: CompanyDto): Promise<CompanyDetails> {
    await this.require(id);
    const row = await this.companies.update(id, {
      name: input.name,
      judicialAdmin: input.judicialAdmin,
      judge: input.judge,
      nature: this.parseNature(input.nature),
      processNumber: input.processNumber,
      protocolDate: new Date(input.protocolDate),
      author: input.author,
      comarca: input.comarca,
      observations: input.observations,
    });

    return toDetails(row);
  }

  /**
   * Removes the company for good, with everything hanging off it. The schema
   * cascades the document rows. The stored objects go first: if the bucket
   * cannot be emptied the row is kept and the failure is loud, never a silent
   * orphan and never a half-deleted company.
   */
  async remove(id: string): Promise<void> {
    await this.require(id);

    try {
      await this.storage.deletePrefix(`${id}/`);
    } catch (error) {
      // The id is an opaque generated value — safe to log, unlike names.
      this.logger.error(`Could not empty storage prefix ${id}/`, error);
      throw new CompanyStorageError();
    }

    await this.companies.delete(id);
  }

  /**
   * Translates the seam's plain error into the HTTP layer's 400. The seam
   * stays Nest-free so it can be unit-tested; the service owns the boundary
   * between domain errors and status codes.
   */
  private parseNature(input: string): 'RECUPERACAO_JUDICIAL' | 'FALENCIA' {
    try {
      return normalizeNature(input);
    } catch (error) {
      if (error instanceof InvalidNatureError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async require(id: string): Promise<Company> {
    const row = await this.companies.findById(id);
    if (!row) {
      throw new CompanyNotFoundError();
    }

    return row;
  }
}

function toCard(row: Company): CompanyCard {
  return {
    id: row.id,
    name: row.name,
    nature: NATURE_LABELS[row.nature],
    processNumber: row.processNumber,
    createdAt: row.createdAt,
  };
}

function toDetails(row: Company): CompanyDetails {
  return {
    ...toCard(row),
    judicialAdmin: row.judicialAdmin,
    judge: row.judge,
    protocolDate: row.protocolDate.toISOString().slice(0, 10),
    author: row.author,
    comarca: row.comarca,
    observations: row.observations,
    updatedAt: row.updatedAt,
  };
}
