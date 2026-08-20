// Persistent proxy on port 3000 that auto-restarts Next.js on port 3001
// This survives sandbox process kills because Bun.serve stays bound to port 3000

import { serve } from "bun";
import { spawn, type ChildProcess } from "child_process";

const NEXT_PORT = 3001;
const PROXY_PORT = 3000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

let nextProc: ChildProcess | null = null;
let nextReady = false;
let restartCount = 0;

function startNext() {
  if (nextProc) return;
  nextReady = false;
  console.log("[proxy] Starting Next.js on port", NEXT_PORT);

  nextProc = spawn(
    "npx",
    ["next", "dev", "-p", String(NEXT_PORT)],
    {
      cwd: "/home/z/my-project",
      env: {
        ...process.env,
        NODE_OPTIONS: "--max-old-space-size=640",
        PORT: String(NEXT_PORT),
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  const logLine = (prefix: string, data: Buffer) => {
    const s = data.toString().trim();
    if (s) console.log(`[next:${prefix}] ${s}`);
    if (s.includes("Ready")) nextReady = true;
  };

  nextProc.stdout?.on("data", (d: Buffer) => logLine("out", d));
  nextProc.stderr?.on("data", (d: Buffer) => logLine("err", d));

  nextProc.on("exit", (code) => {
    console.log(`[proxy] Next.js exited (code=${code}), will restart...`);
    nextProc = null;
    nextReady = false;
    restartCount++;
    setTimeout(startNext, RETRY_DELAY_MS);
  });
}

startNext();

function waitForNext(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (nextReady) return resolve(true);
    let elapsed = 0;
    const check = setInterval(() => {
      elapsed += 500;
      if (nextReady) {
        clearInterval(check);
        resolve(true);
      }
      if (elapsed >= timeoutMs) {
        clearInterval(check);
        resolve(false);
      }
    }, 500);
  });
}

serve({
  port: PROXY_PORT,
  idleTimeout: 255, // 255 seconds — long enough for Google OAuth
  async fetch(req) {
    // Wait for Next.js to be ready (up to 60s)
    const ready = await waitForNext(60000);

    if (!ready) {
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SevaSaathi - Starting...</title>` +
        `<style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui;background:#f8fafc;color:#334155;margin:0}` +
        `.spinner{width:40px;height:40px;border:4px solid #e2e8f0;border-top-color:#14532d;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head>` +
        `<body><div style="text-align:center"><div class="spinner" style="margin:0 auto 16px"></div>` +
        `<h2>🔄 Server is starting...</h2><p>Please wait, this will take a few seconds.</p></div>` +
        `<script>setTimeout(()=>location.reload(),3000)</script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Forward to Next.js on port 3001
    const url = new URL(req.url);
    url.port = String(NEXT_PORT);

    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });

    try {
      const res = await fetch(url.toString(), {
        method: req.method,
        headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
        // @ts-ignore
        duplex: "half",
      } as RequestInit);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        // Don't forward transfer-encoding to avoid double-chunking
        if (k.toLowerCase() !== "transfer-encoding") resHeaders[k] = v;
      });

      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
      });
    } catch (e: any) {
      console.log("[proxy] Forward error:", e.message);
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SevaSaathi - Restarting...</title></head>` +
        `<body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui;background:#f8fafc;color:#334155;margin:0">` +
        `<div style="text-align:center"><div style="width:40px;height:40px;border:4px solid #e2e8f0;border-top-color:#14532d;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px"></div>` +
        `<h2>🔄 Backend restarting...</h2><p>Please wait...</p>` +
        `<style>@keyframes spin{to{transform:rotate(360deg)}}</style>` +
        `<script>setTimeout(()=>location.reload(),2000)</script></div></body></html>`,
        {
          status: 502,
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  },
});

console.log(`[proxy] Proxy listening on :${PROXY_PORT}, forwarding to :${NEXT_PORT}`);
