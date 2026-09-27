import { Module } from '@nestjs/common';
import { RegistrationLimitRepository } from './registration-limit.repository';
import { RegistrationLimitService } from './registration-limit.service';

@Module({
  providers: [RegistrationLimitRepository, RegistrationLimitService],
  exports: [RegistrationLimitService],
})
export class AccountsModule {}
