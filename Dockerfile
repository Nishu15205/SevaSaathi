# ============================================
# SevaSaathi — Docker for Koyeb (SQLite + Turso)
# ============================================

FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare bun@1 --activate
WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
RUN bun install --frozen-lockfile --production=false 2>/dev/null || npm install

FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare bun@1 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate
RUN bun run build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare bun@1 --activate

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

RUN npm install http-proxy --no-save

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql 2>/dev/null || true
COPY --from=builder /app/server ./server
COPY --from=builder /app/mini-services/realtime-service ./mini-services/realtime-service
COPY --from=builder /app/mini-services/realtime-service/node_modules ./mini-services/realtime-service/node_modules 2>/dev/null || true

RUN mkdir -p /app/data /app/public/upload/docs && chmod +x server/start.sh

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api || exit 1

CMD ["sh", "server/start.sh"]
