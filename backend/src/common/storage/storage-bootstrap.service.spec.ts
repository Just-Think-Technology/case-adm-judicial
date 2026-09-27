// Storage bootstrap — the documents bucket exists before the first upload

// Shared fake (see s3.mock.ts). Referenced by mock-prefixed name because
// jest.mock factories cannot see any other out-of-scope variable.
import * as mockS3 from './s3.mock';

jest.mock('@aws-sdk/client-s3', () => mockS3);
jest.mock('@nestjs/common', () => ({
  Injectable: () => () => {},
  Logger: class {
    log(): void {}
    warn(): void {}
  },
}));

import { CreateBucketCommand, HeadBucketCommand, NotFound, S3Client } from '@aws-sdk/client-s3';
import { StorageBootstrapService } from './storage-bootstrap.service';

function mockClient(): { client: S3Client; send: jest.Mock } {
  const send = jest.fn();
  return { client: { send } as unknown as S3Client, send };
}

function notFound(): NotFound {
  return new NotFound({ message: 'Not Found', $metadata: {} });
}

describe('StorageBootstrapService', () => {
  const previousNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
  });

  it('does nothing when the bucket already exists', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValue({});
    const service = new StorageBootstrapService(client, 'documents');

    await service.onModuleInit();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
  });

  it('creates the bucket when the gateway answers NotFound', async () => {
    const { client, send } = mockClient();
    send.mockRejectedValueOnce(notFound()).mockResolvedValueOnce({});
    const service = new StorageBootstrapService(client, 'documents');

    await service.onModuleInit();

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toBeInstanceOf(CreateBucketCommand);
    expect((send.mock.calls[1][0] as CreateBucketCommand).input).toEqual({
      Bucket: 'documents',
    });
  });

  it('keeps the boot alive when storage is unreachable', async () => {
    const { client, send } = mockClient();
    send.mockRejectedValue(new Error('connect ECONNREFUSED 172.20.0.3:8333'));
    const service = new StorageBootstrapService(client, 'documents');

    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('never touches the network in the test environment', async () => {
    process.env.NODE_ENV = 'test';
    const { client, send } = mockClient();
    const service = new StorageBootstrapService(client, 'documents');

    await service.onModuleInit();

    expect(send).not.toHaveBeenCalled();
  });
});
