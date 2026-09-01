# ============================================
# SevaSaathi — Production Docker (Render.com)
# Pure Node.js, Debian-based (for @libsql compatibility)
# ============================================

# --- Stage 1: Dependencies ---
FROM node:20-slim AS deps

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund --legacy-peer-deps

# Install realtime-service deps
WORKDIR /app/mini-services/realtime-service
COPY mini-services/realtime-service/package.json ./
RUN npm install --no-audit --no-fund --legacy-peer-deps --production

# --- Stage 2: Builder ---
FROM node:20-slim AS builder

# Install OpenSSL (required by Prisma)
RUN apt-get update -qq && apt-get install -qq -y --no-install-recommends openssl > /dev/null 2>&1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/mini-services/realtime-service/node_modules ./mini-services/realtime-service/node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js standalone
RUN NODE_OPTIONS="--max-old-space-size=384" npx next build

# --- Stage 3: Runner (minimal) ---
FROM node:20-slim AS runner

# Install OpenSSL (Prisma) + wget (healthcheck)
RUN apt-get update -qq && apt-get install -qq -y --no-install-recommends openssl wget > /dev/null 2>&1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Copy Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client + adapter (needed for Turso)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql

# Also copy http-proxy from builder (used by proxy.cjs)
COPY --from=builder /app/node_modules/http-proxy ./node_modules/http-proxy
COPY --from=builder /app/node_modules/requires-port ./node_modules/requires-port
COPY --from=builder /app/node_modules/follow-redirects ./node_modules/follow-redirects
COPY --from=builder /app/node_modules/eventemitter3 ./node_modules/eventemitter3

# Copy server files (pure CJS proxy)
COPY --from=builder /app/server/proxy.cjs ./server/proxy.cjs
COPY --from=builder /app/server/start.sh ./server/start.sh

# Copy realtime service (plain CJS + its node_modules)
COPY --from=builder /app/mini-services/realtime-service/index.cjs ./mini-services/realtime-service/index.cjs
COPY --from=builder /app/mini-services/realtime-service/node_modules ./mini-services/realtime-service/node_modules
COPY --from=builder /app/mini-services/realtime-service/package.json ./mini-services/realtime-service/package.json

# Create required directories
RUN mkdir -p /app/data /app/public/upload/docs && chmod +x server/start.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["sh", "server/start.sh"]
