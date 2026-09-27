import { Module } from '@nestjs/common';
import { requiredEnv } from '../env';
import { createStorageClient } from './storage.config';
import { StorageService } from './storage.service';

@Module({
  providers: [
    {
      provide: StorageService,
      // The client connects lazily, so building it here never touches the
      // network — safe in every environment including tests.
      useFactory: () =>
        new StorageService(createStorageClient(), requiredEnv('SEAWEEDFS_BUCKET_DOCUMENTS')),
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
