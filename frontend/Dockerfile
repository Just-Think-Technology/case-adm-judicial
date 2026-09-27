# syntax=docker/dockerfile:1
# Frontend — Next.js 16.3.6, Node 22.23.x, pnpm 11.25.0

FROM node:22.23-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY frontend/package.json ./frontend/package.json
RUN pnpm install --filter frontend --frozen-lockfile || pnpm install --filter frontend

FROM deps AS build
COPY frontend ./frontend
WORKDIR /app/frontend
# public/ is an empty, untracked directory in a fresh checkout — git does not
# store empty dirs, so the COPY in the runner stage would fail there. Always
# present, empty or not.
RUN mkdir -p ./public && pnpm build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app/frontend
# Workspace manifests must match the installed tree, otherwise `pnpm run` treats
# deps as stale and re-installs at container start
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ../
COPY --from=deps /app/node_modules ../node_modules
COPY --from=deps /app/frontend/node_modules ./node_modules
COPY --from=build /app/frontend/.next ./.next
COPY --from=build /app/frontend/public ./public
COPY frontend/package.json ./package.json
COPY frontend/next.config.ts ./next.config.ts
EXPOSE 3001
CMD ["pnpm", "start"]
