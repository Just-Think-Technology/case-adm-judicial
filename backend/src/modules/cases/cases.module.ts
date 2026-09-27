import { Module } from '@nestjs/common';
import { StorageModule } from '../../common/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyRepository } from './company.repository';

@Module({
  // Guards come from the auth module — roles are read from the session, never
  // from the request body.
  imports: [AuthModule, StorageModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompanyRepository],
})
export class CasesModule {}
