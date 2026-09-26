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

  const passwordHash = await argon2.hash('Admin@123', { type: argon2.argon2id });

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

  console.log(`Seed: admin created — ${adminEmail} / Admin@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
