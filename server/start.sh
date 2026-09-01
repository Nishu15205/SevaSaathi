#!/bin/sh
# SevaSaathi — Start all services (Next.js + Socket.io + Proxy)
set -e

echo "[Start] === SevaSaathi Production Startup ==="

PROXY_PORT="${PORT:-8080}"
NEXT_PORT=3000
SOCKET_PORT="${SOCKET_PORT:-3005}"

echo "[Start] Starting Socket.io realtime service on port ${SOCKET_PORT}..."
cd /app/mini-services/realtime-service
SOCKET_PORT=$SOCKET_PORT node /app/mini-services/realtime-service/index.mjs &
SOCKET_PID=$!
cd /app

echo "[Start] Starting Next.js on port ${NEXT_PORT}..."
PORT=$NEXT_PORT HOSTNAME=0.0.0.0 NODE_OPTIONS="--max-old-space-size=256" node /app/server.js &
NEXT_PID=$!

echo "[Start] Waiting for services to initialize..."
sleep 3

echo "[Start] Starting reverse proxy on port ${PROXY_PORT}..."
node /app/server/proxy.cjs &
PROXY_PID=$!

echo "[Start] === All services started ==="
echo "[Start]   Proxy:   PID=$PROXY_PID port=${PROXY_PORT}"
echo "[Start]   Next.js: PID=$NEXT_PID port=${NEXT_PORT}"
echo "[Start]   Socket:  PID=$SOCKET_PID port=${SOCKET_PORT}"

# Wait for any child to exit (compatible with Alpine sh)
while true; do
  sleep 2
  ALIVE=0
  kill -0 $NEXT_PID 2>/dev/null && ALIVE=1
  kill -0 $SOCKET_PID 2>/dev/null && ALIVE=1
  kill -0 $PROXY_PID 2>/dev/null && ALIVE=1
  if [ "$ALIVE" = "0" ]; then
    echo "[Start] A service exited, shutting down all..."
    kill $NEXT_PID $SOCKET_PID $PROXY_PID 2>/dev/null
    break
  fi
done

wait 2>/dev/null
echo "[Start] All services stopped."
