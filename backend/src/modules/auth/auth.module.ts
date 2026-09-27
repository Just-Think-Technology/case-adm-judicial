import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { requiredEnv } from '../../common/env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './session.guard';
import { AdminGuard } from './admin.guard';
import { CsrfGuard } from './csrf.guard';
import { CsrfService } from './csrf.service';
import { EmailTokenRepository } from './email-token.repository';
import { OptionalSessionGuard } from './optional-session.guard';
import { PasswordService } from './password.service';
import { SessionRepository } from './session.repository';
import { TokenService } from './token.service';

@Module({
  // User data stays owned by the accounts module — auth reads through its
  // repository and enforces the cap through its service, never Prisma directly.
  imports: [AccountsModule, NotificationsModule],
  controllers: [AuthController],
  providers: [
    SessionRepository,
    EmailTokenRepository,
    PasswordService,
    CsrfService,
    AuthService,
    AuthenticatedGuard,
    AdminGuard,
    CsrfGuard,
    OptionalSessionGuard,
    {
      provide: TokenService,
      useFactory: () => new TokenService(requiredEnv('JWT_ACCESS_SECRET')),
    },
  ],
  exports: [AuthenticatedGuard, AdminGuard, OptionalSessionGuard, TokenService],
})
export class AuthModule {}
