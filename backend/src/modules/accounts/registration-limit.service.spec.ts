// Registration limit service — the 2-accounts-per-IP cap

jest.mock('@nestjs/common', () => ({
  Injectable: () => () => {},
}));

import type { RegistrationLimitRepository } from './registration-limit.repository';
import { MAX_ACCOUNTS_PER_IP } from '../../common/throttling/throttling.constants';
import { AccountLimitExceededError, RegistrationLimitService } from './registration-limit.service';

describe('RegistrationLimitService', () => {
  let countByIp: jest.Mock;
  let service: RegistrationLimitService;

  beforeEach(() => {
    countByIp = jest.fn();
    const limits = { countByIp } as unknown as RegistrationLimitRepository;
    service = new RegistrationLimitService(limits);
  });

  it('allows registration while the address is below the cap', async () => {
    countByIp.mockResolvedValue(MAX_ACCOUNTS_PER_IP - 1);

    await expect(service.assertCanRegister('203.0.113.7')).resolves.toBeUndefined();
  });

  it('allows the first account from an unknown address', async () => {
    countByIp.mockResolvedValue(0);

    await expect(service.assertCanRegister('203.0.113.7')).resolves.toBeUndefined();
  });

  it('rejects once the cap is reached', async () => {
    countByIp.mockResolvedValue(MAX_ACCOUNTS_PER_IP);

    await expect(service.assertCanRegister('203.0.113.7')).rejects.toBeInstanceOf(
      AccountLimitExceededError,
    );
  });

  it('rejects above the cap as well', async () => {
    countByIp.mockResolvedValue(MAX_ACCOUNTS_PER_IP + 3);

    await expect(service.assertCanRegister('203.0.113.7')).rejects.toBeInstanceOf(
      AccountLimitExceededError,
    );
  });

  it('tells the user what to do, in Brazilian Portuguese', async () => {
    countByIp.mockResolvedValue(MAX_ACCOUNTS_PER_IP);

    await expect(service.assertCanRegister('203.0.113.7')).rejects.toThrow(
      /número máximo de contas permitidas/,
    );
  });

  it('counts against the database, so the cap does not reset with the process', async () => {
    countByIp.mockResolvedValue(MAX_ACCOUNTS_PER_IP);

    await service.assertCanRegister('203.0.113.7').catch(() => undefined);

    // A fresh service instance stands in for a restart: the count is re-read,
    // never cached in memory.
    const afterRestart = new RegistrationLimitService({
      countByIp,
    } as unknown as RegistrationLimitRepository);

    await expect(afterRestart.assertCanRegister('203.0.113.7')).rejects.toBeInstanceOf(
      AccountLimitExceededError,
    );
    expect(countByIp).toHaveBeenCalledTimes(2);
  });

  it('keys the count by the address it was given', async () => {
    countByIp.mockResolvedValue(0);

    await service.assertCanRegister('198.51.100.9');

    expect(countByIp).toHaveBeenCalledWith('198.51.100.9');
  });
});
