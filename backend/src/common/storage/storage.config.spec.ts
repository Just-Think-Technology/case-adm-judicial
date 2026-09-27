// Storage connection — client construction and required variables

jest.mock('@aws-sdk/client-s3', () => mockS3);

// Shared fake (see s3.mock.ts). Referenced by mock-prefixed name because
// jest.mock factories cannot see any other out-of-scope variable.
import * as mockS3 from './s3.mock';

import { S3Client } from '@aws-sdk/client-s3';
import { createStorageClient } from './storage.config';

describe('createStorageClient', () => {
  const previousEnv = { ...process.env };

  afterEach(() => {
    process.env = previousEnv;
  });

  it('points at the configured gateway without hard-coding it', () => {
    process.env.SEAWEEDFS_ENDPOINT = 'http://seaweedfs:8333';
    process.env.SEAWEEDFS_ACCESS_KEY = 'user';
    process.env.SEAWEEDFS_SECRET_KEY = 'pass';

    const client = createStorageClient();

    expect(client).toBeInstanceOf(S3Client);
    // The runtime class is the shared fake (see s3.mock.ts); the cast says so
    // explicitly instead of pretending the real SDK exposes constructor args.
    const FakeS3Client = S3Client as unknown as { lastConstructorArgs: unknown };
    expect(FakeS3Client.lastConstructorArgs).toMatchObject({
      endpoint: 'http://seaweedfs:8333',
      forcePathStyle: true,
      credentials: { accessKeyId: 'user', secretAccessKey: 'pass' },
    });
  });
});
