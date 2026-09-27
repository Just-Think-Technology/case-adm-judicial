import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { RegistrationLimitRepository } from './registration-limit.repository';
import { RegistrationLimitService } from './registration-limit.service';
import { UserRepository } from './user.repository';

@Module({
  providers: [RegistrationLimitRepository, RegistrationLimitService, UserRepository, AccountService],
  exports: [RegistrationLimitService, UserRepository, AccountService],
})
export class AccountsModule {}
