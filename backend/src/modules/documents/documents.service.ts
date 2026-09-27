// Documents service — upload, visibility-filtered listing, delivery

import Busboy, { type BusboyFileStream } from '@fastify/busboy';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Request } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { PassThrough, Transform, type Readable } from 'node:stream';
import { StorageService } from '../../common/storage/storage.service';
import { requiredEnv } from '../../common/env';
import { UserRepository } from '../accounts/user.repository';
import { EmailNotVerifiedError } from '../auth/auth.service';
import type { AuthenticatedUser } from '../auth/session.guard';
import { CompanyNotFoundError } from '../cases/companies.service';
import { CompanyRepository } from '../cases/company.repository';
import { canReadDocument } from './document-access';
import {
  DOCUMENT_TYPE_LABELS,
  InvalidDocumentTypeError,
  normalizeDocumentType,
} from './document-type';
import { DocumentRepository, type DocumentWithOwner } from './document.repository';
import { UploadDocumentDto } from './dto/upload-document.dto';
import {
  MAX_FILE_BYTES,
  extensionOf,
  fileNameWithExtension,
  isAcceptedFile,
  isInline,
} from './upload-rules';
import { MailerService } from '../notifications/mailer.service';

/** Thrown when the stored bytes cannot be read back. */
export class DocumentNotFoundError extends NotFoundException {
  constructor() {
    super('Documento não encontrado.');
    this.name = 'DocumentNotFoundError';
  }
}

/** Thrown when the same content is sent twice. */
export class DuplicateDocumentError extends ConflictException {
  constructor() {
    super('Este arquivo já foi enviado anteriormente.');
    this.name = 'DuplicateDocumentError';
  }
}

export interface DocumentSummary {
  id: string;
  name: string;
  type: string;
  customType: string | null;
  status: string;
  visibility: string;
}

export interface DocumentItem extends DocumentSummary {
  uploadedBy: string;
  createdAt: Date;
}

export interface DocumentFile {
  stream: Readable;
  mimeType: string;
  fileName: string;
  inline: boolean;
}

interface StoredUpload {
  filename: string;
  mimeType: string;
  stream: BusboyFileStream;
  sink: PassThrough;
  storageKey: string;
  stored: Promise<{ contentHash: string; size: number }>;
}

interface ParsedUpload {
  fields: Record<string, string>;
  file: StoredUpload | undefined;
  fileCount: number;
  badFormat: boolean;
}

const STATUS_LABELS = {
  EM_ANALISE: 'Em análise',
  DEFERIDO: 'Deferido',
  INDEFERIDO: 'Indeferido',
} as const;

const VISIBILITY_LABELS = {
  PUBLICO: 'Público',
  PRIVADO: 'Privado',
} as const;

/**
 * Bytes still read after the store is doomed before the socket dies. A
 * legitimate overshoot is tiny (the client already sent almost everything);
 * past this, the stream is malicious or broken and indulging it further only
 * burns server time.
 */
const MAX_DRAIN_AFTER_FAILURE = 8 * 1024 * 1024;

/**
 * Owns the documents domain: streaming upload with content identity,
 * visibility-filtered listing, and authorized delivery. Authorization lives in
 * guards for the route and in canReadDocument for the row — the service never
 * trusts the browser for status, visibility, ownership or company.
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly officeEmail: string;

  constructor(
    private readonly documents: DocumentRepository,
    private readonly companies: CompanyRepository,
    private readonly users: UserRepository,
    private readonly storage: StorageService,
    private readonly mailer: MailerService,
  ) {
    this.officeEmail = requiredEnv('JUDICIAL_NOTIFICATION_EMAIL');
  }

  /**
   * Stores one file for a company: cheap checks first, then the stream, then
   * the row, then the notification. Every failure path cleans up what it
   * started, so a rejected upload leaves neither a row nor an object behind.
   */
  async upload(companyId: string, userId: string, req: Request): Promise<DocumentSummary> {
    const company = await this.companies.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundError();
    }

    // Fresh row, not the token claim: the claim can outlive a verification
    // loss by up to one access-token lifetime, and upload requires verified.
    const uploader = await this.users.findById(userId);
    if (!uploader) {
      throw new UnauthorizedException('Sessão inválida ou expirada. Entre novamente.');
    }
    if (!uploader.emailVerified) {
      // Translated at the boundary: the message stays owned by auth (one
      // home), the 403 is this module's answer for an unverified uploader.
      throw new ForbiddenException(new EmailNotVerifiedError().message);
    }

    const parsed = await this.parseAndStore(companyId, req);
    if (!parsed.file) {
      throw parsed.badFormat
        ? new BadRequestException(
            'Formato de arquivo não aceito. Envie PDF, JPEG, JPG, PNG, DOCX ou XLSX.',
          )
        : new BadRequestException('O arquivo é obrigatório.');
    }
    const file = parsed.file;
    if (parsed.fileCount > 1) {
      await this.discard(file);
      throw new BadRequestException('Envie um arquivo por vez.');
    }

    const input = await this.validateFields(parsed.fields).catch(async (error: Error) => {
      await this.discard(file);
      throw error;
    });

    let stored;
    try {
      stored = await file.stored;
    } catch (error) {
      if (error instanceof PayloadTooLargeException) {
        throw error;
      }
      await this.storage.deleteObject(file.storageKey).catch(() => undefined);
      this.logger.error(`Upload to ${file.storageKey} failed`, error);
      throw new StorageUploadError();
    }

    let row;
    try {
      row = await this.documents.create({
        companyId,
        ownerId: uploader.id,
        name: input.name,
        description: input.description,
        type: input.type,
        customType: input.customType,
        visibility: uploader.role === 'ADMIN' ? 'PUBLICO' : 'PRIVADO',
        storageKey: file.storageKey,
        size: stored.size,
        mimeType: file.mimeType,
        extension: extensionOf(file.filename),
        contentHash: stored.contentHash,
      });
    } catch (error) {
      // Lost the content race (or any other write failure): the bytes are
      // already stored, so remove them — a row that never existed must not
      // leave an object behind.
      await this.storage.deleteObject(file.storageKey).catch(() => undefined);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateDocumentError();
      }
      throw error;
    }

    // After the commit, and never blocking it: a notification failure keeps
    // the upload and alerts the office through logs (the mailer swallows).
    await this.mailer.sendNewDocumentEmail(
      { email: this.officeEmail, name: 'Administração Judicial' },
      {
        documentName: row.name,
        companyName: company.name,
        addedBy: uploader.name,
        typeLabel: input.typeLabel,
        description: row.description,
        sentAt: row.createdAt,
      },
    );

    return toSummary(row);
  }

  /**
   * Lists what the viewer may read of a company's documents. Unknown company
   * is a 404; the visibility filter runs in the query, so forbidden rows are
   * never loaded.
   */
  async list(
    companyId: string,
    viewer: AuthenticatedUser | undefined,
    scope: string | undefined,
  ): Promise<DocumentItem[]> {
    const company = await this.companies.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundError();
    }

    const parsedScope = scope ?? 'all';
    if (parsedScope !== 'all' && parsedScope !== 'mine' && parsedScope !== 'admin') {
      throw new BadRequestException('Filtro inválido. Escolha todos, meus ou dos administradores.');
    }

    const rows = await this.documents.findVisible(
      companyId,
      viewer ? { id: viewer.id, role: viewer.role } : undefined,
      parsedScope,
    );

    return rows.map(toItem);
  }

  /** Opens one document for an authorized reader; strangers get a 404. */
  async getContent(id: string, viewer: AuthenticatedUser | undefined): Promise<DocumentFile> {
    const row = await this.documents.findById(id);
    if (
      !row ||
      !canReadDocument(
        { visibility: row.visibility, ownerId: row.ownerId, ownerRole: row.owner.role },
        viewer ? { id: viewer.id, role: viewer.role } : undefined,
      )
    ) {
      throw new DocumentNotFoundError();
    }

    let stream: Readable;
    try {
      stream = await this.storage.getObject(row.storageKey);
    } catch {
      // Row without an object is a broken restore — same answer as missing.
      throw new DocumentNotFoundError();
    }

    return {
      stream,
      mimeType: row.mimeType,
      fileName: sanitizeFileName(fileNameWithExtension(row.name, row.extension)),
      inline: isInline(row.mimeType),
    };
  }

  /**
   * Parses one multipart body while storing the first file immediately. The
   * stream cannot wait for validation: an unconsumed file stalls the parser
   * and buffers in memory, which is exactly what the streaming design avoids.
   * Validation rejects afterwards, and every rejection path destroys the
   * stream and deletes the partial object.
   */
  private parseAndStore(companyId: string, req: Request): Promise<ParsedUpload> {
    return new Promise((resolve, reject) => {
      if (!req.headers['content-type']) {
        reject(new BadRequestException('Envio inválido. Tente novamente.'));
        return;
      }
      let busboy;
      try {
        busboy = Busboy({ headers: req.headers as { 'content-type': string } });
      } catch {
        reject(new BadRequestException('Envio inválido. Tente novamente.'));
        return;
      }

      const fields: Record<string, string> = {};
      let file: StoredUpload | undefined;
      let fileCount = 0;
      let badFormat = false;
      let handlerError: Error | undefined;
      let settled = false;
      // Bytes read past a failed store, bounded below: once the store is
      // doomed the source must still drain (a destroyed file wedges the
      // parser and finish never fires), but a malicious infinite stream must
      // not be indulged — past the cap the socket dies instead.
      let storeFailed = false;
      let drainedAfterFailure = 0;

      const rejectOnce = (error: Error): void => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      };

      busboy.on('field', (name: string, value: string) => {
        fields[name] = value;
      });
      busboy.on(
        'file',
        (name: string, stream: BusboyFileStream, filename: string, encoding: string, mimeType: string) => {
          void name;
          void encoding;
          // A synchronous throw here escapes the parser and kills the process,
          // so the handler body is guarded and the failure surfaces at finish.
          try {
            fileCount += 1;
            // Extra files are drained, not buffered: only the first is kept.
            if (fileCount > 1) {
              stream.resume();
              return;
            }
            if (!isAcceptedFile(filename, mimeType)) {
              badFormat = true;
              stream.resume();
              return;
            }
            const extension = extensionOf(filename);
            const storageKey = `${companyId}/${randomUUID()}.${extension}`;
            const { sink, stored } = this.storeStream(storageKey, mimeType, stream);
            // Settles on its own; a rejection surfaces when awaited. Catching
            // here avoids an unhandled rejection and marks the drain bounded.
            stored.catch(() => {
              storeFailed = true;
            });
            stream.on('data', (chunk: Buffer) => {
              if (!storeFailed) {
                return;
              }
              drainedAfterFailure += chunk.length;
              if (drainedAfterFailure > MAX_DRAIN_AFTER_FAILURE) {
                req.destroy();
              }
            });
            file = { filename, mimeType, stream, sink, storageKey, stored };
          } catch (error) {
            handlerError = error as Error;
            stream.resume();
          }
        },
      );
      busboy.on('error', () => {
        rejectOnce(new BadRequestException('Envio inválido. Tente novamente.'));
      });
      busboy.on('finish', () => {
        if (settled) {
          return;
        }
        settled = true;
        if (handlerError) {
          reject(new BadRequestException('Envio inválido. Tente novamente.'));
          return;
        }
        resolve({ fields, file, fileCount, badFormat });
      });
      req.on('error', () => {
        rejectOnce(new BadRequestException('Envio inválido. Tente novamente.'));
      });
      // A dead socket (client gone, or destroyed past the drain cap) also ends
      // the parse — but only when the body never fully arrived. A completed
      // request closes before busboy emits finish, and that race must not win.
      req.on('close', () => {
        if (!req.complete) {
          rejectOnce(new BadRequestException('Envio inválido. Tente novamente.'));
        }
      });
      req.pipe(busboy);
    });
  }

  /**
   * Pipes the file through a tap into a sink the SDK alone reads. One consumer
   * chain, one flowing direction: the hash and the byte count ride the same
   * chunks the bucket receives, memory stays flat, backpressure propagates end
   * to end, and the SDK keeps its own integrity checksum — which is exactly
   * what breaks when anything else puts the stream in flowing mode first.
   */
  private storeStream(
    storageKey: string,
    mimeType: string,
    stream: BusboyFileStream,
  ): { sink: PassThrough; stored: Promise<{ contentHash: string; size: number }> } {
    const hash = createHash('sha256');
    let size = 0;
    let oversized = false;

    const tap = new Transform({
      transform(chunk: Buffer, _encoding, callback): void {
        size += chunk.length;
        if (size > MAX_FILE_BYTES) {
          oversized = true;
          callback(new Error('File exceeds the 60 MB limit.'));
          return;
        }
        hash.update(chunk);
        callback(null, chunk);
      },
    });
    const sink = new PassThrough();

    const stored = new Promise<{ contentHash: string; size: number }>((resolve, reject) => {
      // Detach the dead chain and let the source drain on failure: a pipe
      // into a destroyed destination backpressures the source into pause,
      // which wedges the parser (finish never fires) and parks the request
      // in silence. The drain is counted and capped in parseAndStore.
      const fail = (error: Error): void => {
        stream.unpipe(tap);
        stream.resume();
        sink.destroy();
        reject(oversized ? oversizeError() : error);
      };
      stream.on('error', fail);
      tap.on('error', fail);
      sink.on('error', fail);
      stream.pipe(tap).pipe(sink);

      this.storage
        .putObject(storageKey, sink, mimeType)
        .then(() => {
          if (oversized || size > MAX_FILE_BYTES) {
            reject(oversizeError());
            return;
          }
          resolve({ contentHash: hash.digest('hex'), size });
        })
        .catch((error: Error) => {
          fail(error);
        });
    });
    // Settles on its own; a rejection surfaces when awaited. Catching here
    // avoids an unhandled rejection crashing the process before the caller
    // gets there.
    stored.catch(() => undefined);

    return { sink, stored };
  }

  /**
   * Stops an in-flight upload and deletes whatever it already stored. Both
   * ends of the chain are destroyed: killing only the source would leave the
   * SDK waiting on a sink that never ends.
   */
  private async discard(file: StoredUpload): Promise<void> {
    file.stream.destroy();
    file.sink.destroy();
    await file.stored.catch(() => undefined);
    await this.storage.deleteObject(file.storageKey).catch(() => undefined);
  }

  /** Binds the text parts into the DTO and runs the same validators as a form. */
  private async validateFields(fields: Record<string, string>): Promise<{
    type: 'HABILITACAO_CREDITO' | 'DIVERGENCIA_CREDITO' | 'HABILITACAO_ACG' | 'OUTROS';
    typeLabel: string;
    customType: string | null;
    name: string;
    description: string | null;
  }> {
    const dto = plainToInstance(UploadDocumentDto, {
      type: fields.type,
      customType: fields.customType,
      name: fields.name,
      description: fields.description,
    });
    const errors = await validate(dto);
    if (errors.length > 0) {
      const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));
      throw new BadRequestException(messages);
    }

    let type;
    try {
      type = normalizeDocumentType(dto.type);
    } catch (error) {
      if (error instanceof InvalidDocumentTypeError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const customType = dto.customType?.trim() ? dto.customType.trim() : null;
    if (type === 'OUTROS' && !customType) {
      throw new BadRequestException('A especificação do tipo é obrigatória quando o tipo é Outros.');
    }

    return {
      type,
      typeLabel:
        type === 'OUTROS' && customType
          ? `${DOCUMENT_TYPE_LABELS.OUTROS} — ${customType}`
          : DOCUMENT_TYPE_LABELS[type],
      customType: type === 'OUTROS' ? customType : null,
      name: dto.name.trim(),
      description: dto.description?.trim() ? dto.description.trim() : null,
    };
  }
}

function oversizeError(): PayloadTooLargeException {
  return new PayloadTooLargeException('O arquivo excede o tamanho máximo de 60 MB.');
}

/** Thrown when the bucket fails mid-upload — the request stays actionable. */
export class StorageUploadError extends InternalServerErrorException {
  constructor() {
    super('Não foi possível concluir o envio. Tente novamente.');
    this.name = 'StorageUploadError';
  }
}

/** Header-safe: quotes and line breaks would split the Content-Disposition. */
function sanitizeFileName(fileName: string): string {
  return fileName.replace(/["\r\n]/g, '');
}

function toSummary(row: {
  id: string;
  name: string;
  type: keyof typeof DOCUMENT_TYPE_LABELS;
  customType: string | null;
  status: keyof typeof STATUS_LABELS;
  visibility: keyof typeof VISIBILITY_LABELS;
}): DocumentSummary {
  return {
    id: row.id,
    name: row.name,
    type: DOCUMENT_TYPE_LABELS[row.type],
    customType: row.customType,
    status: STATUS_LABELS[row.status],
    visibility: VISIBILITY_LABELS[row.visibility],
  };
}

function toItem(row: DocumentWithOwner): DocumentItem {
  return {
    ...toSummary(row),
    uploadedBy: row.owner.name,
    createdAt: row.createdAt,
  };
}
