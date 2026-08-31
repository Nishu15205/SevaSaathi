#!/bin/sh
# SevaSaathi — Start all services (Next.js + Socket.io + Proxy)
set -e

echo "[Start] === SevaSaathi Production Startup ==="

# Push database schema (safe, no-op if already applied)
echo "[Start] Pushing database schema..."
cd /app
bun run db:push -- --accept-data-loss 2>/dev/null || echo "[Start] DB push skipped or already applied"

# Install realtime-service deps if needed
if [ ! -d "/app/mini-services/realtime-service/node_modules" ]; then
  echo "[Start] Installing realtime-service dependencies..."
  cd /app/mini-services/realtime-service
  bun install --production 2>/dev/null || npm install --production 2>/dev/null
  cd /app
fi

# PORT is for the external proxy (set by Koyeb/Render)
PROXY_PORT="${PORT:-8080}"
NEXT_PORT=3000
SOCKET_PORT="${SOCKET_PORT:-3005}"

echo "[Start] Starting Socket.io realtime service on port ${SOCKET_PORT}..."
cd /app/mini-services/realtime-service
SOCKET_PORT=$SOCKET_PORT bun index.ts &
SOCKET_PID=$!
cd /app

echo "[Start] Starting Next.js on port ${NEXT_PORT}..."
PORT=$NEXT_PORT HOSTNAME=0.0.0.0 bun .next/standalone/server.js &
NEXT_PID=$!

# Give services a moment to start
echo "[Start] Waiting for services to initialize..."
sleep 2

echo "[Start] Starting reverse proxy on port ${PROXY_PORT}..."
PORT=$PROXY_PORT node /app/server/proxy.mjs &
PROXY_PID=$!

echo "[Start] === All services started ==="
echo "[Start]   Proxy:   PID=$PROXY_PID port=${PROXY_PORT}"
echo "[Start]   Next.js: PID=$NEXT_PID port=${NEXT_PORT}"
echo "[Start]   Socket:  PID=$SOCKET_PID port=${SOCKET_PORT}"

# Wait for any process to exit
wait -n $NEXT_PID $SOCKET_PID $PROXY_PID
EXIT_CODE=$?

# If any child exits, kill the rest
echo "[Start] Service exited (code=$EXIT_CODE), shutting down all..."
kill $NEXT_PID $SOCKET_PID $PROXY_PID 2>/dev/null
wait 2>/dev/null
exit $EXIT_CODE
