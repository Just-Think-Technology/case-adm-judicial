// Fake S3 SDK shared by the storage specs.
//
// @aws-sdk/client-s3 ships ESM, which jest cannot require — the same reason
// backend specs mock @nestjs/common. A manual mock in __mocks__ does not
// resolve under pnpm symlinks, so each spec activates this module with
// jest.mock('@aws-sdk/client-s3', () => require('./s3.mock')). One home, so
// specs do not each invent their own fake.

class FakeCommand {
  readonly input: unknown;

  constructor(input: unknown) {
    this.input = input;
  }
}

export class HeadBucketCommand extends FakeCommand {}

export class CreateBucketCommand extends FakeCommand {}

export class NotFound extends Error {
  constructor(options?: { message?: string }) {
    super(options?.message ?? 'Not Found');
    this.name = 'NotFound';
  }
}

interface S3ClientArgs {
  endpoint?: unknown;
  region?: unknown;
  credentials?: unknown;
  forcePathStyle?: unknown;
}

export class S3Client {
  static lastConstructorArgs: S3ClientArgs | undefined;

  constructor(args?: S3ClientArgs) {
    S3Client.lastConstructorArgs = args;
  }

  send(): Promise<unknown> {
    throw new Error('S3Client.send must be stubbed per test');
  }
}
