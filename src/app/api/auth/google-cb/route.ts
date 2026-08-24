import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";

/**
 * Get the correct external base URL from the google_redirect_uri cookie.
 * This was stored during google-go from window.location.origin.
 * Falls back to X-Forwarded headers, then req.url.
 */
function getExternalOrigin(req: NextRequest): string {
  // Priority 1: Use the redirect_uri cookie (set from window.location.origin)
  const redirectUri = req.cookies.get("google_redirect_uri")?.value;
  if (redirectUri) {
    try {
      return new URL(redirectUri).origin;
    } catch {}
  }

  // Priority 2: X-Forwarded headers
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host");
  if (proto && host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    return `${proto}://${host}`;
  }

  // Priority 3: req.url (direct access only)
  return new URL(req.url).origin;
}

/** Redirect to a path using the correct external URL */
function redirectTo(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(`${getExternalOrigin(req)}${path}`);
}

/**
 * Handles the Google OAuth callback.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return redirectTo(req, `/?auth=error&message=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return redirectTo(req, `/?auth=error&message=${encodeURIComponent("Missing authorization code or state.")}`);
  }

  // Verify state (CSRF)
  const savedState = req.cookies.get("google_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return redirectTo(req, `/?auth=error&message=${encodeURIComponent("Invalid state parameter. Please try again.")}`);
  }

  // Use the EXACT redirect_uri stored during google-go
  const redirectUri = req.cookies.get("google_redirect_uri")?.value || `${getExternalOrigin(req)}/api/auth/google-cb`;

  // Cookie secure flag
  const proto = req.headers.get("x-forwarded-proto");
  const isSecure = proto === "https" || redirectUri.startsWith("https");

  try {
    // Step 1: Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return redirectTo(req, `/?auth=error&message=${encodeURIComponent("Failed to exchange authorization code.")}`);
    }

    // Step 2: Get user info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.email) {
      return redirectTo(req, `/?auth=error&message=${encodeURIComponent("Could not get user info from Google.")}`);
    }

    // Step 3: Upsert user in database
    const existing = await db.user.findUnique({ where: { email: googleUser.email } });

    // Read the role from cookie (set during google-go)
    const requestedRole = req.cookies.get("google_oauth_role")?.value;
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
      secret: process.env.NEXTAUTH_SECRET || "dev-secret-for-sevasaathi",
    });

    // Step 5: Redirect with auth=success (include new user flag)
    const origin = getExternalOrigin(req);
    const redirectPath = isNewUser
      ? `/?auth=success&new=true&email=${encodeURIComponent(googleUser.email)}`
      : `/?auth=success`;
    const response = NextResponse.redirect(`${origin}${redirectPath}`);

    // Set cookie with both possible names to handle proxy scenarios
    const nextAuthUrl = process.env.NEXTAUTH_URL || '';
    const cookieSecure = nextAuthUrl.startsWith('https') || proto === 'https';
    const cookieName = cookieSecure
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    response.cookies.set(cookieName, jwtToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure,
      maxAge: 30 * 24 * 60 * 60,
    });
    // Also set the non-secure variant so it works regardless of proxy header
    if (cookieSecure) {
      response.cookies.set('next-auth.session-token', jwtToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    console.log(`[google-cb] Session set for: ${googleUser.email}, isNew=${isNewUser}, redirect → ${origin}`);

    // Clear state cookies with path="/" to match how they were set
    response.cookies.set("google_oauth_state", "", { path: "/", maxAge: 0 });
    response.cookies.set("google_redirect_uri", "", { path: "/", maxAge: 0 });
    response.cookies.set("google_oauth_role", "", { path: "/", maxAge: 0 });

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return redirectTo(req, `/?auth=error&message=${encodeURIComponent("An error occurred during Google sign-in.")}`);
  }
}
