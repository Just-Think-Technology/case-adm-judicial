import { Module } from '@nestjs/common';
import { RegistrationLimitRepository } from './registration-limit.repository';
import { RegistrationLimitService } from './registration-limit.service';
import { UserRepository } from './user.repository';

@Module({
  providers: [RegistrationLimitRepository, RegistrationLimitService, UserRepository],
  exports: [RegistrationLimitService, UserRepository],
})
export class AccountsModule {}
