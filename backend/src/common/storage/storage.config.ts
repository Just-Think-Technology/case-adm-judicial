// Storage connection — single home for reaching SeaweedFS

import { S3Client } from '@aws-sdk/client-s3';
import { requiredEnv } from '../env';

/**
 * Builds the S3 client for SeaweedFS. The endpoint, region and credentials all
 * come from the environment; nothing is hard-coded, so dev, staging and
 * production differ only in variables.
 *
 * This is the constructor the upload path (§4.9) reuses — the second usage
 * extracts nothing new, it consumes this home.
 *
 * @returns A client pointed at the configured SeaweedFS S3 gateway
 */
export function createStorageClient(): S3Client {
  return new S3Client({
    endpoint: requiredEnv('SEAWEEDFS_ENDPOINT'),
    region: 'us-east-1',
    credentials: {
      accessKeyId: requiredEnv('SEAWEEDFS_ACCESS_KEY'),
      secretAccessKey: requiredEnv('SEAWEEDFS_SECRET_KEY'),
    },
    forcePathStyle: true,
  });
}
