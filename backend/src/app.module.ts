import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './common/health/health.module';
import { globalThrottler, throttledMessage } from './common/throttling/throttler.config';
import {
  StorageBootstrapService,
  createStorageBootstrapService,
} from './common/storage/storage-bootstrap.service';
import { AuthModule } from './modules/auth/auth.module';
import { CasesModule } from './modules/cases/cases.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // The one rate limiting configuration: global ceiling plus the account-or-IP
    // keying, per .agents/security/rate-limiting.md. Stricter per-route limits
    // are declared as @Throttle metadata when each route is implemented.
    // In-memory storage is sufficient — a single instance, per the decision.
    ThrottlerModule.forRoot({
      throttlers: [globalThrottler],
      errorMessage: throttledMessage,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CasesModule,
    DocumentsModule,
    AccountsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Creates the documents bucket on boot when missing; skips itself when
    // NODE_ENV is test, per .agents/decisions/document-storage.md.
    {
      provide: StorageBootstrapService,
      useFactory: createStorageBootstrapService,
    },
  ],
})
export class AppModule {}
