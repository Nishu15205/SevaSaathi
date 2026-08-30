import { NextResponse } from 'next/server';
import { getPlatformFeePercent } from '@/lib/config';

export async function GET() {
  try {
    const feePercent = await getPlatformFeePercent();
    return NextResponse.json({ feePercent });
  } catch {
    return NextResponse.json({ feePercent: 15 });
  }
}
