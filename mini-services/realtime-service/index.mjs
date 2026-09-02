import { createRequire } from 'node:module';
import { createServer } from 'http';
import { Server } from 'socket.io';

const require = createRequire(import.meta.url);
let PrismaLibSQL = null;
try {
  const mod = require('@prisma/adapter-libsql');
  PrismaLibSQL = mod.PrismaLibSQL || (typeof mod.default === 'function' ? mod.default : null);
  if (PrismaLibSQL && typeof PrismaLibSQL !== 'function') PrismaLibSQL = null;
} catch (e) {
  console.warn('[Realtime] @prisma/adapter-libsql not available');
}

const { PrismaClient } = require('@prisma/client');

function createDb() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.startsWith('libsql://') && PrismaLibSQL) {
      const adapter = new PrismaLibSQL({ url: dbUrl, authToken: process.env.DATABASE_AUTH_TOKEN || '' });
      return new PrismaClient({ adapter });
    }
  } catch (e) {
    console.warn('[Realtime] Turso adapter failed, using default DB:', e.message);
  }
  return new PrismaClient();
}

const db = createDb();
const PORT = parseInt(process.env.SOCKET_PORT || '3005');

const connectedUsers = new Map();

function isSocketIORequest(req) {
  const url = req.url || '/';
  if (url.includes('EIO=')) return true;
  if (url.includes('transport=')) return true;
  const upgrade = req.headers.upgrade;
  return upgrade?.toLowerCase() === 'websocket';
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonRes(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders });
  res.end(JSON.stringify(data));
}

async function handleRestApi(req, res) {
  const url = req.url || '/';
  const method = req.method || 'GET';

  if (method === 'OPTIONS') { jsonRes(res, 200, {}); return; }
  if (url === '/api/health' && method === 'GET') {
    jsonRes(res, 200, { status: 'ok', service: 'sevasaathi-realtime', port: PORT, connectedUsers: connectedUsers.size });
    return;
  }
  if (url === '/api/emit' && method === 'POST') {
    const raw = await parseBody(req);
    let body;
    try { body = JSON.parse(raw.toString()); } catch { jsonRes(res, 400, { error: 'Invalid JSON' }); return; }
    const { event, userId, data } = body;
    if (!event || typeof event !== 'string' || !userId || typeof userId !== 'string') { jsonRes(res, 400, { error: 'Missing event/userId' }); return; }
    io.to(userId).emit(event, data ?? {});
    jsonRes(res, 200, { success: true });
    return;
  }
  if (url === '/api/emit-room' && method === 'POST') {
    const raw = await parseBody(req);
    let body;
    try { body = JSON.parse(raw.toString()); } catch { jsonRes(res, 400, { error: 'Invalid JSON' }); return; }
    const { event, room, data } = body;
    if (!event || typeof event !== 'string' || !room || typeof room !== 'string') { jsonRes(res, 400, { error: 'Missing event/room' }); return; }
    io.to(room).emit(event, data ?? {});
    jsonRes(res, 200, { success: true });
    return;
  }
  jsonRes(res, 404, { error: 'Not found' });
}

const httpServer = createServer();
const io = new Server(httpServer, { path: '/', cors: { origin: '*' }, pingTimeout: 60000, pingInterval: 25000 });

const originalListeners = httpServer.listeners('request');
httpServer.removeAllListeners('request');
const engineHandler = originalListeners[originalListeners.length - 1];

httpServer.on('request', (req, res) => {
  if (isSocketIORequest(req)) { engineHandler(req, res); return; }
  handleRestApi(req, res).catch(() => { if (!res.headersSent) jsonRes(res, 500, { error: 'Internal error' }); });
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    if (!userId) return;
    socket.join(userId);
    if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
    connectedUsers.get(userId).add(socket.id);
  });
  socket.on('leave', (userId) => {
    if (!userId) return;
    socket.leave(userId);
    const s = connectedUsers.get(userId);
    if (s) { s.delete(socket.id); if (s.size === 0) connectedUsers.delete(userId); }
  });
  socket.on('disconnect', () => {
    for (const [uid, ids] of connectedUsers.entries()) { ids.delete(socket.id); if (ids.size === 0) connectedUsers.delete(uid); }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => console.log(`[Realtime] port ${PORT}`));

function shutdown(sig) { io.close(); db.$disconnect(); httpServer.close(() => process.exit(0)); }
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
