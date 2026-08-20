import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";

/**
 * Handles the Google OAuth callback manually.
 * 1. Verifies the state token (CSRF)
 * 2. Exchanges the authorization code for access/refresh tokens
 * 3. Fetches the user profile from Google
 * 4. Upserts the user in the database
 * 5. Creates a NextAuth-compatible JWT session cookie
 * 6. Redirects to /?auth=success
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?auth=error&message=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/?auth=error&message=${encodeURIComponent("Missing authorization code or state.")}`, req.url)
    );
  }

  // Verify state (CSRF)
  const savedState = req.cookies.get("google_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL(`/?auth=error&message=${encodeURIComponent("Invalid state parameter. Please try again.")}`, req.url)
    );
  }

  // Determine protocol for cookie secure flag
  const proto = req.headers.get("x-forwarded-proto") || "https";

  // Use the EXACT redirect_uri that was stored during the auth request
  // This avoids mismatch when proxy headers differ between requests
  const redirectUri = req.cookies.get("google_redirect_uri")?.value || (() => {
    const host = req.headers.get("host") || "localhost:3000";
    return `${proto}://${host}/api/auth/google-cb`;
  })();

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
      return NextResponse.redirect(
        new URL(`/?auth=error&message=${encodeURIComponent("Failed to exchange authorization code.")}`, req.url)
      );
    }

    // Step 2: Get user info from Google
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const googleUser = await userRes.json();
    if (!googleUser.email) {
      return NextResponse.redirect(
        new URL(`/?auth=error&message=${encodeURIComponent("Could not get user info from Google.")}`, req.url)
      );
    }

    // Step 3: Upsert user in database
    const existing = await db.user.findUnique({
      where: { email: googleUser.email },
    });

    let user;
    if (existing) {
      user = await db.user.update({
        where: { email: googleUser.email },
        data: {
          lastLoginAt: new Date(),
          avatarUrl: googleUser.picture || existing.avatarUrl,
        },
      });
    } else {
      user = await db.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || "Google User",
          avatarUrl: googleUser.picture,
          role: "FAMILY",
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
      secret: process.env.NEXTAUTH_SECRET!,
    });

    // Step 5: Set session cookie and redirect to /
    const response = NextResponse.redirect(new URL("/?auth=success", req.url));
    response.cookies.set("next-auth.session-token", jwtToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: proto === "https",
      maxAge: 30 * 24 * 60 * 60,
    });

    console.log("[google-cb] Session cookie set for user:", user.email, "role:", user.role);

    // Clear the state and redirect_uri cookies
    response.cookies.set("google_oauth_state", "", {
      path: "/api/auth/google-cb",
      maxAge: 0,
    });
    response.cookies.set("google_redirect_uri", "", {
      path: "/api/auth/google-cb",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`/?auth=error&message=${encodeURIComponent("An error occurred during Google sign-in.")}`, req.url)
    );
  }
}
