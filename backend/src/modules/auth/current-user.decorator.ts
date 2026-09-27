// Current user — reads the caller the AuthenticatedGuard already verified

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from './session.guard';

/**
 * Hands the handler the authenticated caller. The value always comes from the
 * verified access token — a handler never parses cookies or headers itself.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    return context.switchToHttp().getRequest().user as AuthenticatedUser;
  },
);
