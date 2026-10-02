import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { createPrismaAdapter } from '../src/prisma/prisma-adapter';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });

async function main(): Promise<void> {
  const adminEmail = 'admin@case.local';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin already exists: ${adminEmail}`);
    return;
  }

  // Local development default — overridable without touching code. The value
  // never reaches logs: credentials in stdout end up in collectors.
  // Production refuses the default: a predictable admin password must never
  // exist outside local development.
  const fallback = process.env.NODE_ENV === 'production' ? undefined : 'Admin@123';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? fallback;
  if (!adminPassword) {
    throw new Error('Refusing to seed the admin account: set SEED_ADMIN_PASSWORD.');
  }
  const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });

  await prisma.user.create({
    data: {
      name: 'Administrador',
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Seed: admin ready — ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
