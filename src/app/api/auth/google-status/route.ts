import { NextResponse } from "next/server";

export async function GET() {
  const configured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID.length > 10 &&
    process.env.GOOGLE_CLIENT_SECRET.length > 10
  );

  return NextResponse.json({
    configured,
    nextAuthUrl: process.env.NEXTAUTH_URL || "",
  });
}
