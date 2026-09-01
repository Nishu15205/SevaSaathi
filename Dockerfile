# ============================================
# SevaSaathi — Production Docker (Render.com)
# Pure Node.js (no bun dependency)
# ============================================

# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Install realtime-service deps
WORKDIR /app/mini-services/realtime-service
COPY mini-services/realtime-service/package.json ./
RUN npm install --no-audit --no-fund --production

# --- Stage 2: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/mini-services/realtime-service/node_modules ./mini-services/realtime-service/node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js standalone
RUN NODE_OPTIONS="--max-old-space-size=384" npx next build

# Bundle realtime-service TypeScript → CJS (no bun needed at runtime)
RUN npx esbuild mini-services/realtime-service/index.ts \
    --bundle --platform=node --format=cjs \
    --outfile=mini-services/realtime-service/index.cjs \
    --external:@prisma/client \
    --external:@prisma/adapter-libsql \
    --external:@libsql/client \
    --external:socket.io

# --- Stage 3: Runner (minimal) ---
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Install http-proxy in isolated dir (avoids npm conflicts)
RUN mkdir -p /proxy-deps && cd /proxy-deps && \
    echo '{"name":"proxy","type":"module"}' > package.json && \
    npm install --no-audit --no-fund http-proxy
ENV NODE_PATH="/proxy-deps/node_modules"

# Copy Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client + adapter (needed for Turso)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql

# Copy server files
COPY --from=builder /app/server ./server

# Copy realtime service (compiled JS + its node_modules)
COPY --from=builder /app/mini-services/realtime-service/index.cjs ./mini-services/realtime-service/index.cjs
COPY --from=builder /app/mini-services/realtime-service/node_modules ./mini-services/realtime-service/node_modules
COPY --from=builder /app/mini-services/realtime-service/package.json ./mini-services/realtime-service/package.json

# Create required directories
RUN mkdir -p /app/data /app/public/upload/docs && chmod +x server/start.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["sh", "server/start.sh"]
