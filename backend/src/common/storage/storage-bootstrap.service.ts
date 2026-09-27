// Storage bootstrap — the documents bucket exists before the first upload

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateBucketCommand, HeadBucketCommand, NotFound, S3Client } from '@aws-sdk/client-s3';
import { requiredEnv } from '../env';
import { createStorageClient } from './storage.config';

/**
 * Creates the `documents` bucket on boot when it does not exist yet.
 *
 * A fresh environment — first `up`, new Lightsail volume, recreated SeaweedFS
 * data — reaches the first upload with no bucket, and S3 answers `NoSuchBucket`.
 * Provisioning here instead of in a compose init container means dev, staging
 * and production share one code path instead of three.
 *
 * A missing storage never stops the boot: it is a dependency of documents, not
 * of the process. The failure is logged and `/health` keeps answering; the
 * upload route fails explicitly when the bucket is absent.
 */
@Injectable()
export class StorageBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(StorageBootstrapService.name);

  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async onModuleInit(): Promise<void> {
    // No SeaweedFS exists in the test environment; the E2E suite boots the
    // whole module, so reaching the network here would make every run depend
    // on infrastructure that is intentionally absent.
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      if (error instanceof NotFound) {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket '${this.bucket}' did not exist — created`);
        return;
      }

      this.logger.warn(
        `Storage is unreachable, continuing without bucket check: ${(error as Error).message}`,
      );
    }
  }
}

/** Wires the service with the production client and the configured bucket. */
export function createStorageBootstrapService(): StorageBootstrapService {
  return new StorageBootstrapService(
    createStorageClient(),
    requiredEnv('SEAWEEDFS_BUCKET_DOCUMENTS'),
  );
}
