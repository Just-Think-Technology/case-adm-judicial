// Registration limit repository — accounts created per source IP

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Data access for the per-IP account cap. */
@Injectable()
export class RegistrationLimitRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Counts the accounts already registered from an address.
   *
   * The address is stored for this purpose only
   * (.agents/decisions/accounts-and-access.md), so a row without it is never
   * counted and is not treated as belonging to any IP.
   *
   * @param ip - The source IP address of the registration
   * @returns How many accounts that address already owns
   */
  async countByIp(ip: string): Promise<number> {
    return this.prisma.user.count({ where: { registrationIp: ip } });
  }
}
