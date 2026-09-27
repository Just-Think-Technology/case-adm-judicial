// Storage service — emptying a key prefix

// Shared fake (see s3.mock.ts). Referenced by mock-prefixed name because
// jest.mock factories cannot see any other out-of-scope variable.
import * as mockS3 from './s3.mock';

jest.mock('@aws-sdk/client-s3', () => mockS3);
jest.mock('@nestjs/common', () => ({
  Injectable: () => () => {},
}));

import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { StorageService } from './storage.service';

function mockClient(): { client: S3Client; send: jest.Mock } {
  const send = jest.fn();
  return { client: { send } as unknown as S3Client, send };
}

describe('StorageService.deletePrefix', () => {
  it('lists the prefix and deletes every key it finds', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValueOnce({
      Contents: [{ Key: 'company-1/a.pdf' }, { Key: 'company-1/b.pdf' }],
      IsTruncated: false,
    });
    send.mockResolvedValueOnce({});

    await new StorageService(client, 'documents').deletePrefix('company-1/');

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0]).toBeInstanceOf(ListObjectsV2Command);
    expect(send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectsCommand);
    expect(send.mock.calls[1][0].input).toEqual({
      Bucket: 'documents',
      Delete: { Objects: [{ Key: 'company-1/a.pdf' }, { Key: 'company-1/b.pdf' }] },
    });
  });

  it('pages through a truncated listing instead of leaving a tail', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValueOnce({
      Contents: [{ Key: 'company-1/a.pdf' }],
      IsTruncated: true,
      NextContinuationToken: 'next',
    });
    send.mockResolvedValueOnce({});
    send.mockResolvedValueOnce({ Contents: [{ Key: 'company-1/b.pdf' }], IsTruncated: false });
    send.mockResolvedValueOnce({});

    await new StorageService(client, 'documents').deletePrefix('company-1/');

    expect(send).toHaveBeenCalledTimes(4);
    expect(send.mock.calls[2][0].input).toMatchObject({ ContinuationToken: 'next' });
  });

  it('resolves without a delete call when the prefix is empty', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValueOnce({ Contents: [], IsTruncated: false });

    await new StorageService(client, 'documents').deletePrefix('company-1/');

    expect(send).toHaveBeenCalledTimes(1);
  });
});
