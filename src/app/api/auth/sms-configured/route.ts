import { NextResponse } from 'next/server';
import { isSmsConfigured } from '@/lib/sms';

export async function GET() {
  const configured = await isSmsConfigured();
  return NextResponse.json({ configured });
}
