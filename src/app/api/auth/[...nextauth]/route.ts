import { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Dynamically resolve NEXTAUTH_URL from proxy headers.
 * This ensures Google OAuth callbacks work behind Caddy/reverse-proxy.
 */
function resolveNextAuthUrl(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  const url = `${proto}://${host}`;
  // Only override if not already explicitly set to a non-localhost value
  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
    process.env.NEXTAUTH_URL = url;
  }
}

const handler = NextAuth(authOptions);

export async function GET(req: NextRequest) {
  resolveNextAuthUrl(req);
  return handler(req);
}

export async function POST(req: NextRequest) {
  resolveNextAuthUrl(req);
  return handler(req);
}