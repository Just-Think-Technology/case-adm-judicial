// Storage connection — client construction and required variables

// Shared fake (see s3.mock.ts). Referenced by mock-prefixed name because
// jest.mock factories cannot see any other out-of-scope variable.
import * as mockS3 from './s3.mock';

jest.mock('@aws-sdk/client-s3', () => mockS3);

import { S3Client } from '@aws-sdk/client-s3';
import { createStorageClient, requiredEnv } from './storage.config';

describe('requiredEnv', () => {
  const previousEnv = { ...process.env };

  afterEach(() => {
    process.env = previousEnv;
  });

  it('returns the value when it is set', () => {
    process.env.STORAGE_CONFIG_SPEC = 's3-value';

    expect(requiredEnv('STORAGE_CONFIG_SPEC')).toBe('s3-value');
  });

  it('fails fast on a missing variable instead of an opaque S3 error later', () => {
    delete process.env.STORAGE_CONFIG_SPEC_MISSING;

    expect(() => requiredEnv('STORAGE_CONFIG_SPEC_MISSING')).toThrow(
      'STORAGE_CONFIG_SPEC_MISSING is not set',
    );
  });

  it('treats a blank variable as missing', () => {
    process.env.STORAGE_CONFIG_SPEC_BLANK = '   ';

    expect(() => requiredEnv('STORAGE_CONFIG_SPEC_BLANK')).toThrow();
  });
});

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
