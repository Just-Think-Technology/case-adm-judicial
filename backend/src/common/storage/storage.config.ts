// Storage connection — single home for reaching SeaweedFS

import { S3Client } from '@aws-sdk/client-s3';

/**
 * Fails fast when a required variable is missing, instead of letting the S3
 * client build a request against `undefined` and fail pages later with an
 * opaque error.
 *
 * @param name - The environment variable to read
 * @returns Its value, guaranteed non-empty
 * @throws {Error} If the variable is missing or blank
 */
export function requiredEnv(name: string): string {
  const value = process.env[name];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} is not set — storage cannot be reached without it`);
  }

  return value;
}

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
