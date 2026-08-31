# ============================================
# SevaSaathi — Docker for Koyeb / Render / VPS
# ============================================
# Single container: Next.js + Socket.io + Reverse Proxy
# SQLite database stored in /app/data/
# ============================================

# --- Stage 1: Dependencies ---
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
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Install http-proxy for reverse proxy
RUN npm install http-proxy --no-save

# Copy standalone build
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma (for db:push at runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy reverse proxy
COPY --from=builder /app/server ./server

# Copy realtime-service + its deps
COPY --from=builder /app/mini-services/realtime-service ./mini-services/realtime-service
COPY --from=builder /app/mini-services/realtime-service/node_modules ./mini-services/realtime-service/node_modules 2>/dev/null || true

# Create data + upload directories
RUN mkdir -p /app/data /app/public/upload/docs

# Make startup script executable
RUN chmod +x server/start.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api || exit 1

CMD ["sh", "server/start.sh"]
