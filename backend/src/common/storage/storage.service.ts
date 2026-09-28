// Storage service — object operations behind the S3 client

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import type { Readable } from 'node:stream';

const LIST_PAGE_SIZE = 1000;

/** Part size for streaming uploads — bounded memory no matter the file. */
const MULTIPART_PART_SIZE = 5 * 1024 * 1024;

/**
 * The single home for talking to the object store. The client and bucket are
 * constructor arguments so specs substitute the shared fake (see s3.mock.ts)
 * instead of reaching the network, and the documents slice extends this class
 * instead of opening a second path to the bucket.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  /**
   * Removes every object under a prefix — the whole company folder on company
   * deletion. An empty prefix resolves without a delete call; listing pages
   * through the full set, so a large company cannot leave a tail behind.
   *
   * @param prefix - The key prefix to empty, e.g. `{companyId}/`
   */
  async deletePrefix(prefix: string): Promise<void> {
    let continuationToken: string | undefined;

    try {
      do {
        const listed = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            MaxKeys: LIST_PAGE_SIZE,
            ContinuationToken: continuationToken,
          }),
        );
        const keys = (listed.Contents ?? [])
          .map((object) => object.Key)
          .filter((key): key is string => typeof key === 'string');

        if (keys.length > 0) {
          await this.client.send(
            new DeleteObjectsCommand({
              Bucket: this.bucket,
              Delete: { Objects: keys.map((Key) => ({ Key })) },
            }),
          );
        }

        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
      } while (continuationToken);
    } catch (error) {
      // Deleting from a bucket that was never created is a no-op, not a
      // failure: there is nothing to delete. Logged, never silent — and any
      // other failure (unreachable storage included) still throws.
      if (isNoSuchBucket(error)) {
        this.logger.warn(`Bucket ${this.bucket} does not exist; nothing to delete under ${prefix}.`);
        return;
      }
      throw error;
    }
  }

  /**
   * Stores one object from a live stream. A plain PutObject needs a known
   * content length up front, which a stream does not have — so the upload
   * runs as S3 multipart with 5 MB parts: every part is an ordinary PUT with
   * an explicit length, memory never holds more than one part, and a failure
   * aborts the whole upload instead of leaving fragments.
   */
  async putObject(key: string, body: Readable, contentType: string): Promise<void> {
    let uploadId: string | undefined;
    const etags: Array<{ ETag?: string; PartNumber: number }> = [];
    let pending: Buffer[] = [];
    let pendingBytes = 0;
    let partNumber = 0;

    const ensureUpload = async (): Promise<string> => {
      if (!uploadId) {
        const created = await this.client.send(
          new CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
          }),
        );
        if (!created.UploadId) {
          throw new Error(`Storage did not start a multipart upload for ${key}.`);
        }
        uploadId = created.UploadId;
      }
      return uploadId;
    };

    const abort = async (): Promise<void> => {
      if (uploadId) {
        await this.client
          .send(new AbortMultipartUploadCommand({ Bucket: this.bucket, Key: key, UploadId: uploadId }))
          .catch(() => undefined);
      }
    };

    const flushPart = async (final: boolean): Promise<void> => {
      if (pendingBytes === 0 || (!final && pendingBytes < MULTIPART_PART_SIZE)) {
        return;
      }
      const id = await ensureUpload();
      partNumber += 1;
      const part = Buffer.concat(pending, pendingBytes);
      pending = [];
      pendingBytes = 0;
      const uploaded = await this.client.send(
        new UploadPartCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: id,
          PartNumber: partNumber,
          Body: part,
        }),
      );
      etags.push({ ETag: uploaded.ETag, PartNumber: partNumber });
    };

    try {
      for await (const chunk of body) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
        pending.push(buffer);
        pendingBytes += buffer.length;
        await flushPart(false);
      }
      await flushPart(true);

      if (!uploadId) {
        // Empty file: multipart needs at least one part, so a single plain
        // put covers the edge without ever opening an upload.
        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: new Uint8Array(0),
            ContentType: contentType,
          }),
        );
        return;
      }

      await this.client.send(
        new CompleteMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: etags },
        }),
      );
    } catch (error) {
      await abort();
      throw error;
    }
  }

  /** Opens one object for streaming delivery to an authorized reader. */
  async getObject(key: string): Promise<Readable> {
    const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));

    return object.Body as Readable;
  }

  /** Removes one object — cleanup after a failed record write, or deletion. */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  /**
   * Removes an explicit key list in 1000-key batches — the client-deletion
   * cascade, where objects scatter across company prefixes and no single
   * prefix covers them. An empty list resolves without a call.
   */
  async deleteObjects(keys: string[]): Promise<void> {
    for (let index = 0; index < keys.length; index += 1000) {
      const batch = keys.slice(index, index + 1000);
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })) },
        }),
      );
    }
  }
}

/** The S3 shape for a missing bucket, across SDK versions. */
function isNoSuchBucket(error: unknown): boolean {
  return error instanceof Error && error.name === 'NoSuchBucket';
}
