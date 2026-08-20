import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || !/^\+?[6-9]\d{9,14}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Valid phone number required (10+ digits)' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    await db.user.updateMany({
      where: { phone: cleanPhone },
      data: { otpSecret: `${otp}:${otpExpiry}` },
    });

    // In production, send via MSG91/Twilio/Fast2SMS API here
    // For dev mode, return the OTP in response and log it
    console.log(`\n📱 PHONE OTP for ${cleanPhone}: ${otp}\n`);

    return NextResponse.json({
      message: 'OTP sent to your phone number',
      devOtp: otp, // Only returned in development
    });
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
