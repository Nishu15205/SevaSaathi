# ============================================
# SevaSaathi — Production Docker (Render.com)
# MongoDB + ENV-FIRST config
# ============================================

# Build arg to bust Docker cache on Render
ARG BUILD_DATE=unknown

# --- Stage 1: Dependencies ---
FROM node:20-slim AS deps

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund --legacy-peer-deps

# --- Stage 2: Builder ---
FROM node:20-slim AS builder

# Install OpenSSL (required by Prisma)
RUN apt-get update -qq && apt-get install -qq -y --no-install-recommends openssl > /dev/null 2>&1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use LOCAL prisma binary (pins to v6.x, avoids npx downloading v7)
RUN ./node_modules/.bin/prisma generate

# Build Next.js standalone
RUN NODE_OPTIONS="--max-old-space-size=384" ./node_modules/.bin/next build

# --- Stage 3: Runner (minimal) ---
FROM node:20-slim AS runner

# Install OpenSSL (Prisma) + wget (healthcheck)
RUN apt-get update -qq && apt-get install -qq -y --no-install-recommends openssl wget > /dev/null 2>&1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Copy Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema + generated client + CLI binary
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy seed dependencies
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/mongodb ./node_modules/mongodb
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder /app/node_modules/@esbuild ./node_modules/@esbuild

# Ensure prisma binary is in PATH
RUN ln -sf /app/node_modules/.bin/prisma /usr/local/bin/prisma 2>/dev/null || true

# Copy startup script
COPY --from=builder /app/start.sh ./start.sh
RUN chmod +x ./start.sh

# Create required directories
RUN mkdir -p /app/data /app/public/upload/docs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/healthz || exit 1

# Use startup script (runs prisma db push + seed, then starts server)
CMD ["./start.sh"]
