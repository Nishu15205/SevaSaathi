import { NextResponse } from "next/server";

export async function GET() {
  const configured = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID.length > 5 &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_SECRET.length > 5
  );
  return NextResponse.json({ configured });
}
