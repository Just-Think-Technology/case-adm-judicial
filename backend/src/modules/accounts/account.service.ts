// Account service — the caller's own profile, nothing else's

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';

/** Thrown when the new e-mail belongs to another account. */
export class EmailAlreadyInUseError extends ConflictException {
  constructor() {
    super('Este e-mail já está em uso.');
    this.name = 'EmailAlreadyInUseError';
  }
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}

/**
 * Owns the profile rules of §4.6. An e-mail change never re-verifies — the
 * account stays active on the new address, per the contract's restriction 9.
 */
@Injectable()
export class AccountService {
  constructor(private readonly users: UserRepository) {}

  async profile(userId: string): Promise<Profile> {
    return toProfile(await this.require(userId));
  }

  async updateProfile(userId: string, input: { name?: string; email?: string }): Promise<Profile> {
    const user = await this.require(userId);

    const name = input.name?.trim() ? input.name.trim() : undefined;
    const email = input.email?.trim() ? input.email.trim().toLowerCase() : undefined;

    if (email && email !== user.email) {
      const taken = await this.users.findByEmail(email);
      if (taken && taken.id !== userId) {
        throw new EmailAlreadyInUseError();
      }
    }

    if ((name === undefined || name === user.name) && (email === undefined || email === user.email)) {
      return toProfile(user);
    }

    return toProfile(
      await this.users.updateProfile(userId, {
        ...(name !== undefined && name !== user.name ? { name } : {}),
        ...(email !== undefined && email !== user.email ? { email } : {}),
      }),
    );
  }

  private async require(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Sessão inválida ou expirada. Entre novamente.');
    }
    return user;
  }
}

function toProfile(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}): Profile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}
