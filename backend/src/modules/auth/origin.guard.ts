// Origin guard — the browser must say where the request comes from

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Builds the allow-list from the environment. The gateway origin and the
 * direct frontend origin in development — nothing else may drive
 * state-changing requests through a browser.
 */
export function allowedOrigins(): string[] {
  return [process.env.APP_URL ?? 'http://localhost', process.env.CORS_ORIGIN ?? 'http://localhost:3001'];
}

/**
 * Rejects cookie-carrying requests whose Origin is missing or foreign. Safe
 * methods pass through: e-mail links are GETs with no Origin, and blocking
 * them would break verification and password reset.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const method: unknown = request?.method;

    if (typeof method !== 'string' || SAFE_METHODS.has(method.toUpperCase())) {
      return true;
    }

    const origin: unknown = request?.headers?.origin;
    if (typeof origin !== 'string' || !allowedOrigins().includes(origin)) {
      throw new ForbiddenException('Requisição recusada: origem não permitida.');
    }

    return true;
  }
}
