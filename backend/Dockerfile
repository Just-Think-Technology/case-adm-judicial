# syntax=docker/dockerfile:1
# Backend — NestJS, Node 22.23.x, pnpm 11.25.0 pinned via packageManager + corepack

FROM node:22.23-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY backend/package.json ./backend/package.json
RUN pnpm install --filter backend --frozen-lockfile || pnpm install --filter backend

FROM deps AS build
COPY backend ./backend
WORKDIR /app/backend
RUN pnpm prisma:generate
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=deps /app/node_modules ../node_modules
COPY --from=deps /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY backend/package.json ./package.json
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma:deploy && node dist/main.js"]
