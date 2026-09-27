// CSRF guard — double-submit check for cookie-based state changes

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/** Where the two halves of the check travel. */
export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Compares the readable CSRF cookie against the header carrying the same value.
 * The session cookies are httpOnly so a forged site cannot read them — but it
 * also cannot read this one, which is exactly the point: only code running on
 * our origin can echo the value back.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const cookie: unknown = request?.cookies?.[CSRF_COOKIE_NAME];
    const header: unknown = request?.headers?.[CSRF_HEADER_NAME];

    if (
      typeof cookie !== 'string' ||
      cookie === '' ||
      typeof header !== 'string' ||
      header === '' ||
      cookie !== header
    ) {
      throw new ForbiddenException(
        'Token de segurança ausente ou inválido. Recarregue a página e tente novamente.',
      );
    }

    return true;
  }
}
