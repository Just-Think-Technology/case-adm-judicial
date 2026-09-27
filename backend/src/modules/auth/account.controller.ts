// Account controller — the caller's own menu (§4.6), both roles
//
// Lives in the auth module because its guards do: registering it under
// accounts would cycle the modules (auth already imports accounts). The
// profile rules stay in AccountService, next to the users table.

import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseFilters, UseGuards } from '@nestjs/common';
import { AccountService, type Profile } from '../accounts/account.service';
import { AuthService } from './auth.service';
import { AuthExceptionFilter } from './auth-exception.filter';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedGuard, type AuthenticatedUser } from './session.guard';

@Controller('account')
@UseFilters(AuthExceptionFilter)
@UseGuards(AuthenticatedGuard)
export class AccountController {
  constructor(
    private readonly account: AccountService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  profile(@CurrentUser() user: AuthenticatedUser): Promise<Profile> {
    return this.account.profile(user.id);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateProfileDto,
  ): Promise<Profile> {
    return this.account.updateProfile(user.id, input);
  }

  /** Password change lives here for the path, with auth for the session. */
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.auth.changePassword(
      user.id,
      user.sessionId,
      input.currentPassword,
      input.password,
      input.passwordConfirmation,
    );
  }
}
