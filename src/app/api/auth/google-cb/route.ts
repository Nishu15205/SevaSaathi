import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";
import { getGoogleClientId, getGoogleClientSecret } from "@/lib/config";

const OAUTH_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-for-sevasaathi";

/**
 * Verifies and decodes the signed state token from google-go.
 * Returns { s, r, u, exp } or null if invalid.
 */
function verifySignedState(state: string): { s: string; r: string; u: string; exp: number } | null {
  try {
    const dotIdx = state.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const payloadB64 = state.substring(0, dotIdx);
    const sig = state.substring(dotIdx + 1);
    const expectedSig = crypto
      .createHmac("sha256", OAUTH_SECRET)
      .update(payloadB64)
      .digest("base64url");
    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Get origin from state data (most reliable — came from browser's window.location.origin) */
function getOriginFromState(stateData: { u: string }): string {
  try {
    return new URL(stateData.u).origin;
  } catch {
    return "";
  }
}

/** Redirect to a path using the state's origin (proxy-proof) */
function redirectToStateOrigin(stateData: { u: string }, path: string): NextResponse {
  const origin = getOriginFromState(stateData);
  return NextResponse.redirect(`${origin}${path}`);
}

/**
 * Handles the Google OAuth callback.
 * Reads role + redirectUri from the signed state (no cookies needed).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // For error responses, try to get origin from state if available
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing authorization code or state." }, { status: 400 });
  }

  // Verify signed state (no cookies needed — proxy-proof)
  const stateData = verifySignedState(state);
  if (!stateData) {
    return NextResponse.json({ error: "Invalid or expired state. Please try again." }, { status: 400 });
  }

  // Extract role and redirect URI from state
  const requestedRole = stateData.r || "";
  const redirectUri = stateData.u;
  const origin = getOriginFromState(stateData);

  try {
    // Step 1: Exchange code for tokens
    const [clientId, clientSecret] = await Promise.all([getGoogleClientId(), getGoogleClientSecret()]);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return redirectToStateOrigin(stateData, "/?auth=error&message=" + encodeURIComponent("Failed to exchange authorization code."));
    }

    // Step 2: Get user info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.email) {
      return redirectToStateOrigin(stateData, "/?auth=error&message=" + encodeURIComponent("Could not get user info from Google."));
    }

    // Step 3: Upsert user in database
    const existing = await db.user.findUnique({ where: { email: googleUser.email } });

    const userRole = (requestedRole === "CAREGIVER" || requestedRole === "FAMILY") ? requestedRole : "FAMILY";

    let user;
    let isNewUser = false;
    if (existing) {
      user = await db.user.update({
        where: { email: googleUser.email },
        data: { lastLoginAt: new Date(), avatarUrl: googleUser.picture || existing.avatarUrl },
      });
    } else {
      isNewUser = true;
      user = await db.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || "Google User",
          avatarUrl: googleUser.picture,
          role: userRole,
          phone: "",
          passwordHash: "",
          subscription: "NONE",
        },
      });
    }

    // Step 4: Create a NextAuth-compatible JWT
    const jwtToken = await encode({
      token: {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.avatarUrl,
        role: user.role,
      },
      secret: OAUTH_SECRET,
    });

    // Step 5: Redirect with auth=success
    const redirectPath = isNewUser
      ? `/?auth=success&new=true&email=${encodeURIComponent(googleUser.email)}`
      : "/?auth=success";
    const response = NextResponse.redirect(`${origin}${redirectPath}`);

    // Set session cookie (both secure and non-secure variants for proxy compatibility)
    const isSecure = redirectUri.startsWith("https");
    const cookieName = isSecure
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    response.cookies.set(cookieName, jwtToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 30 * 24 * 60 * 60,
    });
    // Also set non-secure variant so it works regardless of proxy
    if (isSecure) {
      response.cookies.set("next-auth.session-token", jwtToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    console.log(`[google-cb] Session set for: ${googleUser.email}, isNew=${isNewUser}, redirect → ${origin}`);

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return redirectToStateOrigin(stateData, "/?auth=error&message=" + encodeURIComponent("An error occurred during Google sign-in."));
  }
}
