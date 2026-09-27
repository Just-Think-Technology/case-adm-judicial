// Storage service — object operations behind the S3 client

import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

const LIST_PAGE_SIZE = 1000;

/**
 * The single home for talking to the object store. The client and bucket are
 * constructor arguments so specs substitute the shared fake (see s3.mock.ts)
 * instead of reaching the network, and the documents slice extends this class
 * instead of opening a second path to the bucket.
 */
@Injectable()
export class StorageService {
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
  }
}
