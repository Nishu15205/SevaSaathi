// Lightweight proxy: stays on port 3000, auto-restarts Next.js on 3001
// Caddy-friendly: proper HTTP/1.1 response forwarding

import { serve } from "bun";
import { spawn } from "child_process";

const NEXT = 3001;
let nextProc: any = null;
let ready = false;

function startNext() {
  if (nextProc) return;
  ready = false;
  nextProc = spawn("npx", ["next", "dev", "-p", String(NEXT)], {
    cwd: "/home/z/my-project",
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=640" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  nextProc.stdout?.on("data", (d: Buffer) => {
    if (d.toString().includes("Ready")) ready = true;
  });
  nextProc.stderr?.on("data", (d: Buffer) => {
    if (d.toString().includes("Ready")) ready = true;
  });
  nextProc.on("exit", () => {
    nextProc = null;
    ready = false;
    setTimeout(startNext, 2000);
  });
}

startNext();

async function waitFor(timeout: number): Promise<boolean> {
  for (let i = 0; i < timeout / 500 && !ready; i++) await new Promise((r) => setTimeout(r, 500));
  return ready;
}

serve({
  port: 3000,
  idleTimeout: 255,
  async fetch(req: Request): Promise<Response> {
    const ok = await waitFor(60000);
    if (!ok) {
      return new Response(
        "<!DOCTYPE html><html><head><meta charset=utf-8><title>Starting...</title></head><body style='display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui'><h2>🔄 Starting server...<br><small>Please wait or <a href=''>refresh</a></small></h2><script>setTimeout(()=>location.reload(),3000)</script></body></html>",
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    try {
      const url = new URL(req.url);
      url.port = String(NEXT);

      const headers = new Headers();
      req.headers.forEach((v, k) => {
        if (!["host", "connection", "transfer-encoding", "keep-alive"].includes(k.toLowerCase())) {
          headers.set(k, v);
        }
      });

      const init: any = {
        method: req.method,
        headers,
        redirect: "manual",
      };
      if (req.method !== "GET" && req.method !== "HEAD") {
        init.body = req.body;
        init.duplex = "half";
      }

      const res = await fetch(url.toString(), init);

      const resHeaders = new Headers();
      res.headers.forEach((v, k) => {
        if (!["transfer-encoding"].includes(k.toLowerCase())) {
          resHeaders.set(k, v);
        }
      });

      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
      });
    } catch (e: any) {
      return new Response(
        "<!DOCTYPE html><html><head><meta charset=utf-8><title>Restarting...</title></head><body style='display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui'><h2>🔄 Restarting...<br><small>Please wait or <a href=''>refresh</a></small></h2><script>setTimeout(()=>location.reload(),2000)</script></body></html>",
        { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
  },
});

console.log("[proxy] :3000 → :" + NEXT);
