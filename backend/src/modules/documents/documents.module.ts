import { Module } from '@nestjs/common';
import { StorageModule } from '../../common/storage/storage.module';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthModule } from '../auth/auth.module';
import { CasesModule } from '../cases/cases.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentRepository } from './document.repository';
import { ClientsController } from './clients.controller';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  // Guards and the uploader lookup come from auth and accounts; company
  // existence is the cases module's repository; objects and mail come from
  // their homes. The service orchestrates, it owns no table but documents.
  imports: [AuthModule, AccountsModule, CasesModule, StorageModule, NotificationsModule],
  controllers: [DocumentsController, ClientsController],
  providers: [DocumentsService, DocumentRepository],
})
export class DocumentsModule {}
