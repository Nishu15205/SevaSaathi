# ============================================
# SevaSaathi — Production Docker (Render.com)
# ============================================

# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps

# Install bun via official installer
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.1.0"
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
RUN bun install --no-cache --production=false 2>/dev/null || npm install

# Install realtime-service deps
WORKDIR /app/mini-services/realtime-service
COPY mini-services/realtime-service/package.json ./
RUN bun install --no-cache --production 2>/dev/null || npm install --production

# --- Stage 2: Builder ---
FROM node:20-alpine AS builder

RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.1.0"
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/mini-services/realtime-service/node_modules ./mini-services/realtime-service/node_modules
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build Next.js standalone (limited memory for 512MB free tier)
RUN NODE_OPTIONS="--max-old-space-size=384" bun run build

# --- Stage 3: Runner ---
FROM node:20-alpine AS runner

# Install bun for runtime
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.1.0"
ENV PATH="/root/.bun/bin:$PATH"

# Install http-proxy for the reverse proxy
RUN npm install http-proxy --no-save

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Copy Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client + adapter
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql

# Copy server files
COPY --from=builder /app/server ./server

# Copy realtime service with its deps
COPY --from=builder /app/mini-services/realtime-service ./mini-services/realtime-service

# Create required directories
RUN mkdir -p /app/data /app/public/upload/docs && chmod +x server/start.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["sh", "server/start.sh"]
