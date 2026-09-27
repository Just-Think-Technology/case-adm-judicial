// Storage service — emptying a key prefix

// Shared fake (see s3.mock.ts). Referenced by mock-prefixed name because
// jest.mock factories cannot see any other out-of-scope variable.
import * as mockS3 from './s3.mock';

jest.mock('@aws-sdk/client-s3', () => mockS3);
jest.mock('@nestjs/common', () => ({
  Injectable: () => () => {},
}));

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
import { Readable } from 'node:stream';
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

describe('StorageService object operations', () => {
  it('streams through multipart: create, parts, complete', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValueOnce({ UploadId: 'upload-1' });
    send.mockResolvedValueOnce({ ETag: '"etag-1"' });
    send.mockResolvedValueOnce({});

    await new StorageService(client, 'documents').putObject(
      'company-1/a.pdf',
      Readable.from([Buffer.from('ab'), Buffer.from('cd')]),
      'application/pdf',
    );

    expect(send.mock.calls[0][0]).toBeInstanceOf(CreateMultipartUploadCommand);
    expect(send.mock.calls[1][0]).toBeInstanceOf(UploadPartCommand);
    expect(send.mock.calls[1][0].input).toMatchObject({
      Bucket: 'documents',
      Key: 'company-1/a.pdf',
      UploadId: 'upload-1',
      PartNumber: 1,
    });
    expect(send.mock.calls[1][0].input.Body).toHaveLength(4);
    expect(send.mock.calls[2][0]).toBeInstanceOf(CompleteMultipartUploadCommand);
    expect(send.mock.calls[2][0].input.MultipartUpload).toEqual({
      Parts: [{ ETag: '"etag-1"', PartNumber: 1 }],
    });
  });

  it('aborts the upload when the stream fails after parts went out', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValueOnce({ UploadId: 'upload-1' });
    send.mockResolvedValueOnce({ ETag: '"etag-1"' });
    send.mockResolvedValueOnce({});
    const failing = new Readable({
      read() {
        this.push(Buffer.alloc(5 * 1024 * 1024 + 1));
        this.destroy(new Error('boom'));
      },
    });

    await expect(
      new StorageService(client, 'documents').putObject('company-1/a.pdf', failing, 'application/pdf'),
    ).rejects.toThrow('boom');

    const kinds = send.mock.calls.map((call) => call[0].constructor.name);
    expect(kinds).toContain(AbortMultipartUploadCommand.name);
    expect(kinds).not.toContain(CompleteMultipartUploadCommand.name);
  });

  it('stores an empty file with a single put and no upload', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValueOnce({});

    await new StorageService(client, 'documents').putObject(
      'company-1/empty.pdf',
      Readable.from([]),
      'application/pdf',
    );

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
  });

  it('gets by key and hands the stream over', async () => {
    const { client, send } = mockClient();
    const stream = { pipe: jest.fn() };
    send.mockResolvedValueOnce({ Body: stream });

    const body = await new StorageService(client, 'documents').getObject('company-1/a.pdf');

    expect(send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
    expect(body).toBe(stream);
  });

  it('deletes by key', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValueOnce({});

    await new StorageService(client, 'documents').deleteObject('company-1/a.pdf');

    expect(send.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand);
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: 'documents', Key: 'company-1/a.pdf' });
  });
});
