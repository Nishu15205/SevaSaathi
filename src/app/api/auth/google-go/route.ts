import { NextRequest, NextResponse } from "next/server";

/**
 * Generates the real Google OAuth URL with the correct redirect_uri.
 * Accepts an optional `origin` query param from the client (most reliable).
 * Falls back to proxy headers (x-forwarded-host, x-forwarded-proto).
 */
export async function GET(req: NextRequest) {
  // Priority 1: Use origin passed from the client (browser's window.location.origin)
  // This is the most reliable because the browser always knows its actual URL
  let baseUrl = req.nextUrl.searchParams.get("origin");

  if (!baseUrl) {
    // Priority 2: Use proxy headers
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "localhost:3000";
    baseUrl = `${proto}://${host}`;
  }

  // Remove trailing slash if present
  baseUrl = baseUrl.replace(/\/+$/, "");

  const redirectUri = `${baseUrl}/api/auth/google-cb`;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state: state,
  });

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const response = NextResponse.json({ url: googleUrl });
  response.cookies.set("google_oauth_state", state, {
    path: "/api/auth/google-cb",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}
