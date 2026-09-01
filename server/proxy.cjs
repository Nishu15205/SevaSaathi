/**
 * SevaSaathi — Simple reverse proxy (no dependencies)
 * Routes between Next.js (:3000) and Socket.io (:3005)
 */
const http = require('http');

const NEXT_PORT = 3000;
const SOCKET_PORT = 3005;
const LISTEN_PORT = parseInt(process.env.PORT || '8080');

function proxyHttp(req, res, targetPort) {
  const opts = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${targetPort}` },
  };
  const proxyReq = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    }
  });
  req.pipe(proxyReq);
}

function proxyWs(req, socket, head, targetPort) {
  const opts = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    headers: req.headers,
  };
  const proxyReq = http.request(opts);
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    res.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n');
    res.write('Upgrade: WebSocket\r\n');
    res.write('Connection: Upgrade\r\n');
    Object.entries(proxyRes.headers).forEach(([k, v]) => res.write(`${k}: ${v}\r\n`));
    res.write('\r\n');
    res.flushHeaders?.();
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on('error', () => socket.destroy());
  proxyReq.end();
}

function isSocketRequest(url) {
  return url.includes(`XTransformPort=${SOCKET_PORT}`) || url.includes('EIO=') || url.includes('socket.io');
}

const server = http.createServer((req, res) => {
  const url = req.url || '';
  if (isSocketRequest(url)) {
    req.url = url.replace(/[?&]XTransformPort=\d+/, '').replace(/\?$/, '') || '/';
    proxyHttp(req, res, SOCKET_PORT);
  } else {
    proxyHttp(req, res, NEXT_PORT);
  }
});

server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';
  if (isSocketRequest(url)) {
    req.url = url.replace(/[?&]XTransformPort=\d+/, '').replace(/\?$/, '') || '/';
    proxyWs(req, socket, head, SOCKET_PORT);
  } else {
    proxyWs(req, socket, head, NEXT_PORT);
  }
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Listening on 0.0.0.0:${LISTEN_PORT}`);
  console.log(`[Proxy] Next.js  -> http://127.0.0.1:${NEXT_PORT}`);
  console.log(`[Proxy] Socket.io -> http://127.0.0.1:${SOCKET_PORT}`);
});
