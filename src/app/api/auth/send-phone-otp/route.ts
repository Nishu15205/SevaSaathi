import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPhoneOtp, isSmsConfigured } from '@/lib/sms';

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

    // Try real SMS delivery
    const smsResult = await sendPhoneOtp(cleanPhone, otp);

    if (isSmsConfigured()) {
      // Real SMS was attempted
      if (smsResult.success) {
        return NextResponse.json({
          message: 'OTP sent to your phone number',
        });
      }
      return NextResponse.json(
        { error: 'Failed to send SMS. Please try again.' },
        { status: 500 }
      );
    }

    // Dev mode: return OTP in response
    return NextResponse.json({
      message: 'OTP sent to your phone number (dev mode)',
      devOtp: otp,
    });
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
