# syntax=docker/dockerfile:1

# ---- deps: install with the lockfile ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat && corepack enable && corepack prepare pnpm@11.2.2 --activate
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# ---- builder: compile the standalone server ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat && corepack enable && corepack prepare pnpm@11.2.2 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined at build time, so they must be provided here.
# Server-only secrets (LOGIN_HMAC_SECRET, API_UPSTREAM_URL, API_TENANT_ID) are
# read at runtime instead — pass them to `docker run`, not here.
ARG NEXT_PUBLIC_USE_LIVE_API=false
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY=""
ENV NEXT_PUBLIC_USE_LIVE_API=$NEXT_PUBLIC_USE_LIVE_API \
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- runner: minimal image that runs the standalone server ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
