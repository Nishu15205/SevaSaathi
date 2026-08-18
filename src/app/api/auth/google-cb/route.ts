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
 * 6. Closes the popup window
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return popupCloseResponse(`Google sign-in failed: ${error}`);
  }

  if (!code || !state) {
    return popupCloseResponse("Missing authorization code or state.");
  }

  // Verify state (CSRF)
  const savedState = req.cookies.get("google_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return popupCloseResponse("Invalid state parameter. Please try again.");
  }

  // Build the correct redirect_uri from proxy headers
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  const redirectUri = `${proto}://${host}/api/auth/google-cb`;

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
      return popupCloseResponse("Failed to exchange authorization code.");
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
      return popupCloseResponse("Could not get user info from Google.");
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

    // Step 5: Set session cookie and close popup
    const response = popupCloseResponse("success");
    response.cookies.set("next-auth.session-token", jwtToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: proto === "https",
      maxAge: 30 * 24 * 60 * 60,
    });

    // Clear the state cookie
    response.cookies.set("google_oauth_state", "", {
      path: "/api/auth/google-cb",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return popupCloseResponse("An error occurred during Google sign-in.");
  }
}

/**
 * Returns an HTML page that closes the popup and notifies the parent window.
 */
function popupCloseResponse(message: string) {
  const html = `<!DOCTYPE html>
<html><head><title>Google Sign In</title></head>
<body>
<script>
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: 'google-oauth-callback', success: ${message === "success"} },
        window.location.origin
      );
    }
  } catch(e) {}
  window.close();
  // If window.close() doesn't work (some browsers block it), show a message
  setTimeout(function() {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;text-align:center;padding:20px;">' +
      '<div><h2 style="color:#16a34a;">✓ Signed in successfully!</h2>' +
      '<p style="color:#666;">You can close this window and return to SevaSaathi.</p></div></div>';
  }, 1000);
</script>
</body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
