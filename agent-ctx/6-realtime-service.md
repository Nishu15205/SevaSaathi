# Task 6: Socket.io Real-time Notification Service

## Summary
Built a Socket.io real-time notification mini-service at `mini-services/realtime-service/` (port 3005) with REST API endpoints for the Next.js backend to trigger events, plus a client-side `useSocket` hook.

## Files Created/Modified

### New Files
- `mini-services/realtime-service/package.json` — Independent bun project with socket.io + @prisma/client
- `mini-services/realtime-service/index.ts` — Socket.io server + REST API on port 3005
- `src/hooks/useSocket.ts` — Client-side React hook for WebSocket connection

### Dependencies Added
- `socket.io-client@4.8.3` in main project
- `socket.io@4.8.3`, `@prisma/client@6.19.3` in mini-service

## Architecture

### Request Routing
Socket.io with `path: '/'` intercepts all HTTP requests. To coexist REST API and Socket.io on the same port, the service:
1. Creates the HTTP server and Socket.io server
2. Removes all 'request' listeners (including socket.io's)
3. Installs a unified handler that checks `isSocketIORequest()` (detects `EIO=`/`transport=` query params or WebSocket upgrade header)
4. Routes socket.io requests to the original engine.io handler
5. Routes all other requests to the REST API handler (async body parsing)

### REST API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check with connected user count and uptime |
| POST | `/api/emit` | Emit event to a specific user's room (`{event, userId, data}`) |
| POST | `/api/emit-room` | Emit event to a custom room (`{event, room, data}`) |

### Socket.io Events
- `join(userId)` — Client joins their userId room
- `leave(userId)` — Client leaves a room
- `joined` — Confirmation after joining
- Consumes: `notification:new`, `booking:update`, `report:new`, `payment:update` (emitted via REST API)

### Client Hook (`useSocket`)
- Connects via `io('/?XTransformPort=3005')` with websocket + polling fallback
- Auto-reconnects (10 attempts, 2s delay)
- Auto-joins userId room on connect
- Returns `{ socketRef, connected }` for use in effects/event handlers

## Testing Results
All endpoints verified working:
- ✅ GET /api/health returns service status
- ✅ POST /api/emit emits to user room and delivers to connected socket
- ✅ POST /api/emit-room emits to custom room
- ✅ Socket.io WebSocket connection, join, and event delivery
- ✅ Validation errors (missing fields, invalid JSON)
- ✅ 404 for unknown routes
- ✅ ESLint: 0 errors
