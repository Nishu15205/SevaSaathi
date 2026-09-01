# ============================================
# SevaSaathi — Production Docker (Render.com)
# Step 1: Next.js only (direct on PORT)
# Step 2: Will add proxy+socket later
# ============================================

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

# Create required directories
RUN mkdir -p /app/data /app/public/upload/docs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/healthz || exit 1

# Next.js standalone reads PORT env var directly
CMD ["node", "server.js"]
