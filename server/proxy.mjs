/**
 * SevaSaathi — Single-port reverse proxy
 * Routes between Next.js (:3000) and Socket.io (:3005)
 * Handles HTTP + WebSocket upgrade
 */
import http from 'http';
import { createProxyServer } from 'http-proxy';

const NEXT_PORT = 3000;
const SOCKET_PORT = 3005;
const LISTEN_PORT = parseInt(process.env.PORT || '8080');

const proxy = createProxyServer({
  xfwd: true,
  ws: true,
});

// --- HTTP routing ---
const server = http.createServer((req, res) => {
  const url = req.url || '';

  if (
    url.includes(`XTransformPort=${SOCKET_PORT}`) ||
    url.includes('EIO=') ||
    url.includes('socket.io')
  ) {
    // Strip XTransformPort from URL before forwarding
    const cleanUrl = url
      .replace(/[?&]XTransformPort=\d+/, '')
      .replace(/\?$/, '') || '/';
    req.url = cleanUrl;
    proxy.web(req, res, { target: `http://127.0.0.1:${SOCKET_PORT}` });
  } else {
    proxy.web(req, res, { target: `http://127.0.0.1:${NEXT_PORT}` });
  }
});

// --- WebSocket upgrade routing ---
server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';
  if (
    url.includes(`XTransformPort=${SOCKET_PORT}`) ||
    url.includes('EIO=') ||
    url.includes('socket.io')
  ) {
    const cleanUrl = url
      .replace(/[?&]XTransformPort=\d+/, '')
      .replace(/\?$/, '') || '/';
    req.url = cleanUrl;
    proxy.ws(req, socket, head, { target: `http://127.0.0.1:${SOCKET_PORT}` });
  } else {
    // WebSocket upgrades for Next.js (if any)
    proxy.ws(req, socket, head, { target: `http://127.0.0.1:${NEXT_PORT}` });
  }
});

proxy.on('error', (err, req, res) => {
  console.error('[Proxy] Error:', err.message);
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway');
  }
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Listening on 0.0.0.0:${LISTEN_PORT}`);
  console.log(`[Proxy] Next.js  -> http://127.0.0.1:${NEXT_PORT}`);
  console.log(`[Proxy] Socket.io -> http://127.0.0.1:${SOCKET_PORT}`);
});
