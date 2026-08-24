import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";
import { getGoogleClientId, getGoogleClientSecret } from "@/lib/config";

const OAUTH_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-for-sevasaathi";

/**
 * Handles the Google OAuth callback.
 * Looks up the state token from the database (no signed-state needed).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing authorization code or state." },
      { status: 400 }
    );
  }

  // Look up state in database
  let stateData: { role: string; redirectUrl: string } | null = null;
  try {
    const record = await db.oAuthState.findUnique({
      where: { stateToken: state },
    });

    if (!record) {
      console.error("[google-cb] State not found in DB:", state);
      return NextResponse.json(
        { error: "Invalid or expired state. Please try again." },
        { status: 400 }
      );
    }

    if (record.expiresAt < new Date()) {
      console.error("[google-cb] State expired:", state);
      // Clean up
      await db.oAuthState.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: "State expired. Please try again." },
        { status: 400 }
      );
    }

    // Consume the state (one-time use)
    await db.oAuthState.delete({ where: { id: record.id } });

    stateData = { role: record.role, redirectUrl: record.redirectUrl };
  } catch (err) {
    console.error("[google-cb] DB error looking up state:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }

  const origin = stateData.redirectUrl;

  try {
    // Step 1: Exchange code for tokens
    const [clientId, clientSecret] = await Promise.all([
      getGoogleClientId(),
      getGoogleClientSecret(),
    ]);

    const redirectUri = `${origin}/api/auth/google-cb`;

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
      return NextResponse.redirect(
        `${origin}/?auth=error&message=${encodeURIComponent("Failed to exchange authorization code.")}`
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
        `${origin}/?auth=error&message=${encodeURIComponent("Could not get user info from Google.")}`
      );
    }

    // Step 3: Upsert user in database
    const existing = await db.user.findUnique({
      where: { email: googleUser.email },
    });

    const requestedRole =
      stateData.role === "CAREGIVER" || stateData.role === "FAMILY"
        ? stateData.role
        : "FAMILY";

    let user;
    let isNewUser = false;
    if (existing) {
      user = await db.user.update({
        where: { email: googleUser.email },
        data: {
          lastLoginAt: new Date(),
          avatarUrl: googleUser.picture || existing.avatarUrl,
        },
      });
    } else {
      isNewUser = true;
      user = await db.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || "Google User",
          avatarUrl: googleUser.picture,
          role: requestedRole,
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
    const isSecure = origin.startsWith("https");
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

    console.log(
      `[google-cb] Session set for: ${googleUser.email}, isNew=${isNewUser}, redirect → ${origin}`
    );

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${origin}/?auth=error&message=${encodeURIComponent("An error occurred during Google sign-in.")}`
    );
  }
}
