import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    // Prisma 7: connection via prisma.config.ts, not datasource url
    // Use DIRECT_URL (privileged) for migrate, fallback to DATABASE_URL
    // See .agents/decisions/database.md
  },
});
