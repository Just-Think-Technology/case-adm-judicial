// Registration limit — at most 2 accounts per source IP

import { Injectable } from '@nestjs/common';
import { MAX_ACCOUNTS_PER_IP } from '../../common/throttling/throttling.constants';
import { RegistrationLimitRepository } from './registration-limit.repository';

/** Thrown when an address has already used up its allowance. */
export class AccountLimitExceededError extends Error {
  constructor() {
    super(
      'Você já criou o número máximo de contas permitidas para este endereço. ' +
        'Se precisar de mais, entre em contato com a administração judicial.',
    );
    this.name = 'AccountLimitExceededError';
  }
}

/**
 * The 2-accounts-per-IP cap.
 *
 * This is a business rule, not a throttle: it is not time-based, it must survive
 * a restart, and it is evaluated **before** the account is created. That is why it
 * counts rows in the database instead of using the in-memory throttler — the
 * throttler's window would reset on every deploy and let the cap be bypassed.
 */
@Injectable()
export class RegistrationLimitService {
  constructor(private readonly limits: RegistrationLimitRepository) {}

  /**
   * Fails when the address has no allowance left.
   *
   * @param ip - The source IP address of the registration
   * @throws {AccountLimitExceededError} If the cap is already reached
   */
  async assertCanRegister(ip: string): Promise<void> {
    const existing = await this.limits.countByIp(ip);

    if (existing >= MAX_ACCOUNTS_PER_IP) {
      throw new AccountLimitExceededError();
    }
  }
}
