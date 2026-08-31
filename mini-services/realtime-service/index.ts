import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:/app/data/sevasaathi.db';

function createDb() {
  if (dbUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: dbUrl, authToken: process.env.DATABASE_AUTH_TOKEN });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const db = createDb();
const PORT = parseInt(process.env.SOCKET_PORT || '3005');

const connectedUsers = new Map<string, Set<string>>();

function isSocketIORequest(req: IncomingMessage): boolean {
  const url = req.url || '/';
  if (url.includes('EIO=')) return true;
  if (url.includes('transport=')) return true;
  const upgrade = req.headers.upgrade;
  return upgrade?.toLowerCase() === 'websocket';
}

function parseBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonRes(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders });
  res.end(JSON.stringify(data));
}

async function handleRestApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '/';
  const method = req.method || 'GET';

  if (method === 'OPTIONS') { jsonRes(res, 200, {}); return true; }

  if (url === '/api/health' && method === 'GET') {
    jsonRes(res, 200, { status: 'ok', service: 'sevasaathi-realtime', port: PORT, connectedUsers: connectedUsers.size, uptime: process.uptime() });
    return true;
  }

  if (url === '/api/emit' && method === 'POST') {
    const raw = await parseBody(req);
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw.toString()); } catch { jsonRes(res, 400, { error: 'Invalid JSON' }); return true; }
    const { event, userId, data } = body;
    if (!event || typeof event !== 'string' || !userId || typeof userId !== 'string') { jsonRes(res, 400, { error: 'Missing event/userId' }); return true; }
    io.to(userId).emit(event, data ?? {});
    jsonRes(res, 200, { success: true });
    return true;
  }

  if (url === '/api/emit-room' && method === 'POST') {
    const raw = await parseBody(req);
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw.toString()); } catch { jsonRes(res, 400, { error: 'Invalid JSON' }); return true; }
    const { event, room, data } = body;
    if (!event || typeof event !== 'string' || !room || typeof room !== 'string') { jsonRes(res, 400, { error: 'Missing event/room' }); return true; }
    io.to(room).emit(event, data ?? {});
    jsonRes(res, 200, { success: true });
    return true;
  }

  jsonRes(res, 404, { error: 'Not found' });
  return true;
}

const httpServer = createServer();
const io = new Server(httpServer, { path: '/', cors: { origin: '*' }, pingTimeout: 60000, pingInterval: 25000 });

const originalListeners = httpServer.listeners('request');
httpServer.removeAllListeners('request');
const engineHandler = originalListeners[originalListeners.length - 1];

httpServer.on('request', (req: IncomingMessage, res: ServerResponse) => {
  if (isSocketIORequest(req)) { (engineHandler as any)(req, res); return; }
  handleRestApi(req, res).catch(() => { if (!res.headersSent) jsonRes(res, 500, { error: 'Internal error' }); });
});

io.on('connection', (socket) => {
  socket.on('join', (userId: string) => {
    if (!userId) return;
    socket.join(userId);
    if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
    connectedUsers.get(userId)!.add(socket.id);
  });
  socket.on('leave', (userId: string) => {
    if (!userId) return;
    socket.leave(userId);
    const s = connectedUsers.get(userId);
    if (s) { s.delete(socket.id); if (s.size === 0) connectedUsers.delete(userId); }
  });
  socket.on('disconnect', () => {
    for (const [uid, ids] of connectedUsers.entries()) { ids.delete(socket.id); if (ids.size === 0) connectedUsers.delete(uid); }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => console.log(`[Realtime] port ${PORT} | DB: ${dbUrl}`));

function shutdown(sig: string) { io.close(); db.$disconnect(); httpServer.close(() => process.exit(0)); }
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
