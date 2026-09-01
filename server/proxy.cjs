/**
 * SevaSaathi — Single-port reverse proxy
 * Routes between Next.js (:3000) and Socket.io (:3005)
 * Pure CJS — no ESM issues
 */
const http = require('http');
const httpProxy = require('http-proxy');
const createProxyServer = typeof httpProxy === 'function' ? httpProxy : httpProxy.createProxyServer;

const NEXT_PORT = 3000;
const SOCKET_PORT = 3005;
const LISTEN_PORT = parseInt(process.env.PORT || '8080');

const proxy = createProxyServer({
  xfwd: true,
  ws: true,
});

const server = http.createServer((req, res) => {
  const url = req.url || '';

  if (
    url.includes('XTransformPort=' + SOCKET_PORT) ||
    url.includes('EIO=') ||
    url.includes('socket.io')
  ) {
    const cleanUrl = url
      .replace(/[?&]XTransformPort=\d+/, '')
      .replace(/\?$/, '') || '/';
    req.url = cleanUrl;
    proxy.web(req, res, { target: 'http://127.0.0.1:' + SOCKET_PORT });
  } else {
    proxy.web(req, res, { target: 'http://127.0.0.1:' + NEXT_PORT });
  }
});

server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';
  if (
    url.includes('XTransformPort=' + SOCKET_PORT) ||
    url.includes('EIO=') ||
    url.includes('socket.io')
  ) {
    const cleanUrl = url
      .replace(/[?&]XTransformPort=\d+/, '')
      .replace(/\?$/, '') || '/';
    req.url = cleanUrl;
    proxy.ws(req, socket, head, { target: 'http://127.0.0.1:' + SOCKET_PORT });
  } else {
    proxy.ws(req, socket, head, { target: 'http://127.0.0.1:' + NEXT_PORT });
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
  console.log('[Proxy] Listening on 0.0.0.0:' + LISTEN_PORT);
  console.log('[Proxy] Next.js  -> http://127.0.0.1:' + NEXT_PORT);
  console.log('[Proxy] Socket.io -> http://127.0.0.1:' + SOCKET_PORT);
});
