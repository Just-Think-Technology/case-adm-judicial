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
RUN pnpm prisma:generate && pnpm build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app/backend
# Workspace manifests must match the installed tree, otherwise `pnpm run` treats
# deps as stale and re-installs at container start
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ../
COPY --from=deps /app/node_modules ../node_modules
COPY --from=deps /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
# prisma.config.ts carries the datasource URL in Prisma 7 — migrate deploy fails without it
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/prisma.config.ts ./prisma.config.ts
COPY backend/package.json ./package.json
# The generated client lives inside the pnpm virtual store, which the runner takes
# from the pre-generate deps stage — regenerate it in place or the app cannot import it
RUN pnpm prisma:generate
# The process never runs as root: it reads its files, streams uploads and logs
# to stdout — nothing at runtime needs a write to the image filesystem.
USER node
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma:deploy && node dist/main.js"]
