// Auth exception filter — domain errors become HTTP statuses with PT-BR bodies

import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { AccountLimitExceededError } from '../accounts/registration-limit.service';
import {
  EmailAlreadyRegisteredError,
  EmailNotVerifiedError,
  IncorrectCurrentPasswordError,
  InvalidCredentialsError,
  InvalidResetLinkError,
  InvalidSessionError,
  InvalidVerificationLinkError,
  PasswordMismatchError,
  PasswordUnchangedError,
  VerificationCooldownError,
} from './auth.service';

const STATUS_BY_ERROR: Array<[new (...args: never[]) => Error, HttpStatus]> = [
  [EmailAlreadyRegisteredError, HttpStatus.CONFLICT],
  [AccountLimitExceededError, HttpStatus.FORBIDDEN],
  [EmailNotVerifiedError, HttpStatus.FORBIDDEN],
  [InvalidCredentialsError, HttpStatus.UNAUTHORIZED],
  [InvalidSessionError, HttpStatus.UNAUTHORIZED],
  [InvalidVerificationLinkError, HttpStatus.BAD_REQUEST],
  [InvalidResetLinkError, HttpStatus.BAD_REQUEST],
  [PasswordMismatchError, HttpStatus.BAD_REQUEST],
  [IncorrectCurrentPasswordError, HttpStatus.BAD_REQUEST],
  [PasswordUnchangedError, HttpStatus.BAD_REQUEST],
  [VerificationCooldownError, HttpStatus.TOO_MANY_REQUESTS],
];

/**
 * Translates the auth domain errors. Anything else — a Prisma failure, a bug —
 * falls through to the global handler instead of leaking internals.
 */
@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();

    for (const [type, status] of STATUS_BY_ERROR) {
      if (error instanceof type) {
        response.status(status).json({
          statusCode: status,
          message: (error as Error).message,
        });
        return;
      }
    }

    throw error;
  }
}
