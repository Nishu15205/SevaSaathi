// Node.js proxy on :3000 → Next.js on :3001
// Auto-restarts Next.js if it dies. Caddy-compatible.

import http from "http";
import { spawn } from "child_process";

const NEXT_PORT = 3001;
let nextProc = null;
let nextReady = false;

function startNext() {
  if (nextProc) return;
  nextReady = false;
  console.log("[proxy] Starting Next.js on port", NEXT_PORT);
  nextProc = spawn("npx", ["next", "dev", "-p", String(NEXT_PORT)], {
    cwd: "/home/z/my-project",
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=640" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const log = (d) => {
    const s = d.toString();
    if (s.includes("Ready")) { nextReady = true; console.log("[proxy] Next.js is READY"); }
  };
  nextProc.stdout?.on("data", (d) => log(d));
  nextProc.stderr?.on("data", (d) => log(d));
  nextProc.on("exit", () => {
    console.log("[proxy] Next.js exited, restarting in 2s...");
    nextProc = null;
    nextReady = false;
    setTimeout(startNext, 2000);
  });
}

startNext();

const RESTART_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>SevaSaathi - Starting...</title></head>
<body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui;background:#f8fafc">
<div style="text-align:center">
  <div style="width:40px;height:40px;border:4px solid #e2e8f0;border-top-color:#14532d;border-radius:50%;animation:s 1s linear infinite;margin:0 auto 16px"></div>
  <h2>🔄 Server is starting...</h2>
  <p>This will take a few seconds.</p>
  <style>@keyframes s{to{transform:rotate(360deg)}}</style>
  <script>setTimeout(()=>location.reload(),3000)</script>
</div></body></html>`;

function waitForNext(timeout) {
  return new Promise((resolve) => {
    if (nextReady) return resolve(true);
    let elapsed = 0;
    const check = setInterval(() => {
      elapsed += 500;
      if (nextReady) { clearInterval(check); resolve(true); }
      if (elapsed >= timeout) { clearInterval(check); resolve(false); }
    }, 500);
  });
}

const server = http.createServer(async (req, res) => {
  const ok = await waitForNext(60000);
  if (!ok) {
    res.writeHead(502, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(RESTART_HTML);
  }

  const opts = {
    hostname: "127.0.0.1",
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${NEXT_PORT}` },
  };

  const proxyReq = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", () => {
    res.writeHead(502, { "Content-Type": "text/html; charset=utf-8" });
    res.end(RESTART_HTML);
  });

  req.pipe(proxyReq);
});

server.listen(3000, "0.0.0.0", () => {
  console.log("[proxy] Listening on :3000, forwarding to :" + NEXT_PORT);
});

server.keepAliveTimeout = 120000;
server.headersTimeout = 30000;
