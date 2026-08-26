import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '/home/z/my-project/node_modules/@prisma/client';

// Initialize Prisma with the shared SQLite database
const db = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/home/z/my-project/db/custom.db',
    },
  },
});

const PORT = 3005;

// Track connected users
const connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

function getConnectedUserCount(): number {
  return connectedUsers.size;
}

/**
 * Check if a request is a socket.io / engine.io request.
 * Engine.io requests always contain 'EIO=' or 'transport=' query params,
 * or are WebSocket upgrade requests.
 */
function isSocketIORequest(req: IncomingMessage): boolean {
  const url = req.url || '/';
  // Engine.io requests have EIO= and transport= query params
  if (url.includes('EIO=')) return true;
  if (url.includes('transport=')) return true;
  // WebSocket upgrade requests
  const upgrade = req.headers.upgrade;
  if (upgrade && upgrade.toLowerCase() === 'websocket') return true;
  return false;
}

// Helper to parse JSON body from a request
function parseBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// CORS headers for REST API responses
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// JSON response helper
function jsonRes(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders });
  res.end(JSON.stringify(data));
}

// REST API handler
async function handleRestApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    jsonRes(res, 200, {});
    return true;
  }

  // GET /api/health
  if (url === '/api/health' && method === 'GET') {
    jsonRes(res, 200, {
      status: 'ok',
      service: 'sevasaathi-realtime',
      port: PORT,
      connectedUsers: getConnectedUserCount(),
      uptime: process.uptime(),
    });
    return true;
  }

  // POST /api/emit - emit to a specific user's room
  if (url === '/api/emit' && method === 'POST') {
    const raw = await parseBody(req);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw.toString());
    } catch {
      jsonRes(res, 400, { error: 'Invalid JSON body' });
      return true;
    }

    const { event, userId, data } = body;
    if (!event || typeof event !== 'string' || !userId || typeof userId !== 'string') {
      jsonRes(res, 400, { error: 'Missing or invalid event or userId' });
      return true;
    }

    io.to(userId).emit(event, data ?? {});
    console.log(`[REST] Emitted "${event}" to room "${userId}"`);
    jsonRes(res, 200, { success: true, event, userId });
    return true;
  }

  // POST /api/emit-room - emit to a custom room
  if (url === '/api/emit-room' && method === 'POST') {
    const raw = await parseBody(req);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw.toString());
    } catch {
      jsonRes(res, 400, { error: 'Invalid JSON body' });
      return true;
    }

    const { event, room, data } = body;
    if (!event || typeof event !== 'string' || !room || typeof room !== 'string') {
      jsonRes(res, 400, { error: 'Missing or invalid event or room' });
      return true;
    }

    io.to(room).emit(event, data ?? {});
    console.log(`[REST] Emitted "${event}" to room "${room}"`);
    jsonRes(res, 200, { success: true, event, room });
    return true;
  }

  // Not an API route — return 404
  jsonRes(res, 404, { error: 'Not found' });
  return true;
}

// Create HTTP server without a request handler
const httpServer = createServer();

// Initialize Socket.io server
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Remove all existing 'request' listeners (including socket.io's)
const originalListeners = httpServer.listeners('request');
httpServer.removeAllListeners('request');

// Find the engine.io request handler (the one socket.io added)
// It's typically the last listener that was added
const engineHandler = originalListeners.find(
  (listener) => listener.name !== 'handleRequest' || originalListeners.length === 1
) || originalListeners[originalListeners.length - 1];

// Install our unified request handler that routes between REST API and socket.io
httpServer.on('request', (req: IncomingMessage, res: ServerResponse) => {
  if (isSocketIORequest(req)) {
    // Let engine.io handle socket.io requests
    (engineHandler as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
    return;
  }

  // Handle REST API (async)
  handleRestApi(req, res).catch((err) => {
    console.error('[REST] Error handling request:', err);
    if (!res.headersSent) {
      jsonRes(res, 500, { error: 'Internal server error' });
    }
  });
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join a user's personal room based on userId
  socket.on('join', (userId: string) => {
    if (!userId || typeof userId !== 'string') return;

    socket.join(userId);
    console.log(`[Socket] ${socket.id} joined room "${userId}"`);

    // Track the connection
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);

    // Send confirmation
    socket.emit('joined', { userId, message: `Joined room ${userId}` });
  });

  // Leave a room
  socket.on('leave', (userId: string) => {
    if (!userId || typeof userId !== 'string') return;
    socket.leave(userId);
    console.log(`[Socket] ${socket.id} left room "${userId}"`);

    const userSockets = connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        connectedUsers.delete(userId);
      }
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);

    // Clean up all rooms this socket was in
    for (const [userId, socketIds] of connectedUsers.entries()) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        connectedUsers.delete(userId);
      }
    }
  });

  // Error handler
  socket.on('error', (error) => {
    console.error(`[Socket] Error on ${socket.id}:`, error);
  });
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`[SevaSaathi Realtime] Service running on port ${PORT}`);
  console.log(`[SevaSaathi Realtime] REST endpoints: POST /api/emit, POST /api/emit-room`);
  console.log(`[SevaSaathi Realtime] Health check: GET /api/health`);
  console.log(`[SevaSaathi Realtime] Database: /home/z/my-project/db/custom.db`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`[SevaSaathi Realtime] Received ${signal}, shutting down...`);
  io.close();
  db.$disconnect();
  httpServer.close(() => {
    console.log('[SevaSaathi Realtime] Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
