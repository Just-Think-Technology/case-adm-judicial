// Password service — argon2id hashing, the only approved password hash

import * as argon2 from 'argon2';

/**
 * Cost parameters, recorded here per .agents/decisions/accounts-and-access.md.
 * A change in cost is an announced decision, not a silent tweak: raising it
 * slows every login, lowering it weakens every stored hash.
 */
export const ARGON2_TIME_COST = 3;
export const ARGON2_MEMORY_COST_KIB = 65536;
export const ARGON2_PARALLELISM = 4;

/** Hashes and verifies passwords. Timing-safe comparison is argon2's own. */
export class PasswordService {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      timeCost: ARGON2_TIME_COST,
      memoryCost: ARGON2_MEMORY_COST_KIB,
      parallelism: ARGON2_PARALLELISM,
    });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      // A malformed stored hash is a data problem, not a user error — and it
      // must never surface as a 500 with a stack trace. Reject the password.
      return false;
    }
  }
}
