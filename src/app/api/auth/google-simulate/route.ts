import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { db } from "@/lib/db";

/**
 * Simulated Google sign-in via redirect flow.
 * GET: Validates params, creates/finds user, sets session cookie, redirects to /?auth=success
 * This uses a full-page redirect (not AJAX) so cookies survive the proxy chain.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const role = searchParams.get("role") || "FAMILY";
    const origin = searchParams.get("origin");

    // Use client-provided origin for redirect (like google-go does)
    const redirectBase = origin
      ? origin.replace(/\/+$/, "")
      : getOrigin(req);

    if (!email || !name) {
      return NextResponse.redirect(`${redirectBase}/?auth=error&message=${encodeURIComponent("Email and name are required.")}`);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const userRole = (role === "CAREGIVER" || role === "FAMILY") ? role : "FAMILY";

    if (!trimmedEmail.includes("@")) {
      return NextResponse.redirect(`${redirectBase}/?auth=error&message=${encodeURIComponent("Please enter a valid email address.")}`);
    }

    // Find or create user
    let user = await db.user.findUnique({ where: { email: trimmedEmail } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await db.user.create({
        data: {
          email: trimmedEmail,
          name: trimmedName || "Google User",
          avatarUrl: null,
          role: userRole,
          phone: "",
          passwordHash: "",
          subscription: "NONE",
        },
      });
    } else {
      user = await db.user.update({
        where: { email: trimmedEmail },
        data: { lastLoginAt: new Date() },
      });
    }

    if (!user.isActive) {
      return NextResponse.redirect(`${redirectBase}/?auth=error&message=${encodeURIComponent("This account has been deactivated.")}`);
    }

    // Create a NextAuth-compatible JWT token
    // Include both 'sub' and 'id' — NextAuth uses 'sub' internally
    const token = await encode({
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

    const redirectPath = isNewUser
      ? `/?auth=success&new=true&email=${encodeURIComponent(user.email)}`
      : `/?auth=success`;

    const response = NextResponse.redirect(`${redirectBase}${redirectPath}`);

    // Set cookie with both possible names to handle proxy scenarios
    // NextAuth picks the right one based on request protocol
    const isSecure = (process.env.NEXTAUTH_URL || '').startsWith('https')
      || req.headers.get('x-forwarded-proto') === 'https';
    const cookieName = isSecure
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    // Also set the non-secure variant so it works regardless of proxy header
    if (isSecure) {
      response.cookies.set('next-auth.session-token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
    }

    console.log(`[google-simulate] Session set for: ${user.email}, isNew=${isNewUser}, redirect → ${redirectBase}`);
    return response;
  } catch (err: any) {
    console.error("[google-simulate] Error:", err);
    const origin = req.nextUrl.searchParams.get("origin") || getOrigin(req);
    return NextResponse.redirect(`${origin}/?auth=error&message=${encodeURIComponent("Something went wrong. Please try again.")}`);
  }
}

/** Fallback: get origin from forwarded headers */
function getOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}
