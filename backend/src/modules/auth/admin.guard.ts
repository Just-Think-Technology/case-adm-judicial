// Admin guard — ADMIN role required, nothing else decided here

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Allows only administrators through. Authentication itself is the preceding
 * guard's job: unauthenticated requests never reach this one, so a rejection
 * here always means an authenticated non-admin and is always a 403.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const role: unknown = request?.user?.role;

    if (role !== 'ADMIN') {
      throw new ForbiddenException('Acesso proibido.');
    }

    return true;
  }
}
