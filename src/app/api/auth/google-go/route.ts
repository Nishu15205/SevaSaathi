import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getGoogleClientId } from "@/lib/config";

/**
 * Generates the Google OAuth URL.
 * Stores state data in the DB and passes a short UUID as the state param.
 * This avoids proxy issues with long signed-state strings.
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

  // Create a short UUID as state — store the real data in DB
  const stateToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.oAuthState.create({
    data: {
      stateToken,
      role,
      redirectUrl: baseUrl,
      expiresAt,
    },
  });

  // Clean up old expired states
  await db.oAuthState.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state: stateToken,
  });

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleUrl);
}
