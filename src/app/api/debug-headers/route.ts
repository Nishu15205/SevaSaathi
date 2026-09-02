import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    host: req.headers.get("host"),
    "x-forwarded-proto": req.headers.get("x-forwarded-proto"),
    "x-forwarded-host": req.headers.get("x-forwarded-host"),
    origin: req.headers.get("origin"),
    referer: req.headers.get("referer"),
    fullUrl: req.url,
  });
}
