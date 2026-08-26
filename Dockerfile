# ============================================
# SevaSaathi — Production Docker Image
# ============================================
# Multi-stage build for minimal image size
# Works on: VPS, Railway, Render, Fly.io, any Docker host
# ============================================

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare bun@1 --activate
WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
RUN bun install --frozen-lockfile --production=false 2>/dev/null || npm install

# --- Stage 2: Build ---
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare bun@1 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate
RUN bun run build

# --- Stage 3: Production ---
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare bun@1 --activate

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create data directory for SQLite (persistent volume)
RUN mkdir -p /app/data /app/upload && \
    chown -R nextjs:nodejs /app/data /app/upload

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy Prisma schema (needed for db:push at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api || exit 1

USER nextjs

CMD ["bun", "server.js"]