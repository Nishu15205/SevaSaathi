import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getGoogleClientId } from "@/lib/config";

const OAUTH_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-for-sevasaathi";

/**
 * Creates a signed state token that encodes role + redirectUri.
 * Format: base64url(payload).base64url(hmac)
 * This eliminates the need for cookies which get stripped by proxies.
 */
function createSignedState(role: string, redirectUri: string): string {
  const payload = JSON.stringify({
    s: crypto.randomUUID(),
    r: role,
    u: redirectUri,
    exp: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", OAUTH_SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

/**
 * Generates the real Google OAuth URL.
 * Uses signed state (no cookies needed) — proxy-proof.
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

  // Create self-contained signed state (role + redirectUri baked in)
  const state = createSignedState(role, redirectUri);

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

  return NextResponse.redirect(googleUrl);
}
