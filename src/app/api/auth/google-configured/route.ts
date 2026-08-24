import { NextResponse } from "next/server";
import { getGoogleClientId, getGoogleClientSecret } from "@/lib/config";

export async function GET() {
  const clientId = await getGoogleClientId();
  const clientSecret = await getGoogleClientSecret();
  const configured = !!(clientId && clientId.length > 5 && clientSecret && clientSecret.length > 5);
  return NextResponse.json({ configured });
}
