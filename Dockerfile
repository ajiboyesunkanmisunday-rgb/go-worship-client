FROM node:24-alpine AS base

# ── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --prefer-offline uses the lockfile for versions while allowing the
# onlyBuiltDependencies approval (from pnpm-workspace.yaml) to be registered.
RUN corepack enable pnpm && pnpm install --prefer-offline

# ── builder ──────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (public only — no secrets)
ARG NEXT_PUBLIC_USE_LIVE_API=true
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV NEXT_PUBLIC_USE_LIVE_API=$NEXT_PUBLIC_USE_LIVE_API
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

# next.config.ts sets output: 'standalone'
RUN corepack enable pnpm && pnpm build

# ── runner ───────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone bundle + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
