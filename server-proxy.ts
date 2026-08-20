import { serve } from "bun";
import { spawn } from "child_process";

let nextProc: ReturnType<typeof spawn> | null = null;
let ready = false;

function startNext() {
  if (nextProc) return;
  ready = false;
  nextProc = spawn(
    "npx",
    ["next", "dev", "-p", "3001"],
    {
      cwd: "/home/z/my-project",
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=640" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  nextProc.stdout?.on("data", (d: Buffer) => {
    const s = d.toString();
    if (s.includes("Ready")) ready = true;
  });
  nextProc.stderr?.on("data", (d: Buffer) => {
    const s = d.toString();
    if (s.includes("Ready")) ready = true;
  });
  nextProc.on("exit", () => {
    nextProc = null;
    ready = false;
    setTimeout(startNext, 3000);
  });
}

startNext();

serve({
  port: 3000,
  async fetch(req) {
    // Give Next.js up to 30s to become ready
    for (let i = 0; i < 30 && !ready; i++) {
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!ready) {
      return new Response(
        "<html><body><h2>🔄 Server is starting...</h2><p>Please refresh in 5 seconds.</p><script>setTimeout(()=>location.reload(),3000)</script></body></html>",
        { headers: { "Content-Type": "text/html" } }
      );
    }
    const url = new URL(req.url);
    url.port = "3001";
    try {
      const res = await fetch(url.toString(), {
        method: req.method,
        headers: Object.fromEntries(req.headers),
        body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
        duplex: "half",
      } as any);
      return new Response(res.body, {
        status: res.status,
        headers: Object.fromEntries(res.headers),
      });
    } catch (e) {
      return new Response("Backend starting, please refresh", { status: 502 });
    }
  },
});
console.log("[proxy] Port 3000 → 3001");
