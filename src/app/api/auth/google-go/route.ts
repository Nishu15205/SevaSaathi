import { NextRequest, NextResponse } from "next/server";

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

  // Store state + redirect_uri + role in cookies, then REDIRECT to Google
  const response = NextResponse.redirect(googleUrl);
  response.cookies.set("google_oauth_state", state, {
    path: "/api/auth/google-cb",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
  });
  // Store the redirect_uri so the callback uses the EXACT same value
  response.cookies.set("google_redirect_uri", redirectUri, {
    path: "/api/auth/google-cb",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
  });
  // Store the role so the callback knows whether to create FAMILY or CAREGIVER
  response.cookies.set("google_oauth_role", role, {
    path: "/api/auth/google-cb",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}
