import { NextRequest, NextResponse } from "next/server";
import { getGoogleClientId } from "@/lib/config";

/**
 * Generates the real Google OAuth URL with the correct redirect_uri.
 * Stores the redirect_uri and role in cookies so the callback can reuse them.
 */
export async function GET(req: NextRequest) {
  // Priority 1: Use origin passed from the client (browser's window.location.origin)
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
  const role = req.nextUrl.searchParams.get("role") || "";

  const clientId = await getGoogleClientId();
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

  // Store state + redirect_uri + role in cookies with path="/" so they survive proxy chain
  const response = NextResponse.redirect(googleUrl);
  response.cookies.set("google_oauth_state", state, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
  });
  response.cookies.set("google_redirect_uri", redirectUri, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
  });
  response.cookies.set("google_oauth_role", role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}
