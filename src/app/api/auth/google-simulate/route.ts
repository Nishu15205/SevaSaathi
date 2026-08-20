import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, role } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const userRole = (role === "CAREGIVER" || role === "FAMILY") ? role : "FAMILY";

    if (!trimmedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Find or create user (same logic as the real Google OAuth callback)
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
      // Update last login
      user = await db.user.update({
        where: { email: trimmedEmail },
        data: { lastLoginAt: new Date() },
      });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Create a NextAuth-compatible JWT token
    const token = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.avatarUrl,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
      secret: process.env.NEXTAUTH_SECRET || "dev-secret-for-sevasaathi",
    });

    // Build the response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isNewUser,
      },
    });

    // Set the NextAuth session cookie
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Also set the CSRF token cookie (NextAuth expects this)
    response.cookies.set("next-auth.csrf-token", "simulated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[google-simulate] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
