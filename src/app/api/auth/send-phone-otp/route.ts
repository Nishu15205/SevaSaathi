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

    if (smsResult.actuallyDelivered) {
      // Real SMS sent successfully — no dev OTP shown
      return NextResponse.json({
        message: 'OTP sent to your phone number',
      });
    }

    // SMS provider NOT configured → dev mode, show dev OTP
    const smsAvailable = await isSmsConfigured();
    if (!smsAvailable) {
      return NextResponse.json({
        message: 'OTP sent to your phone number (dev mode)',
        devOtp: otp,
      });
    }

    // SMS provider configured but delivery FAILED
    // Do NOT show dev OTP — the OTP is stored in DB, user should check their phone
    return NextResponse.json({
      error: `Failed to send SMS: ${smsResult.error || 'Unknown error'}. Please try again or contact support.`,
    }, { status: 502 });
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    // Distinguish between dev mode (show OTP) and provider failure (hide OTP)
    const smsAvailable = await isSmsConfigured();
    if (!smsAvailable) {
      // Dev mode — no provider, return the OTP for testing
      return NextResponse.json({
        message: 'OTP sent (dev mode)',
        devOtp: otp,
      });
    }
    // Provider configured but errored — do NOT expose OTP
    return NextResponse.json({
      error: err.message || 'Failed to send OTP. Please try again.',
    }, { status: 500 });
  }
}
