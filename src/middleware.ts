import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to dynamically set NEXTAUTH_URL from proxy headers.
 * This ensures NextAuth works correctly behind Caddy/reverse-proxy.
 */
export function middleware(req: NextRequest) {
  // Only run on NextAuth routes
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "localhost:3000";
    const url = `${proto}://${host}`;
    if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
      process.env.NEXTAUTH_URL = url;
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
