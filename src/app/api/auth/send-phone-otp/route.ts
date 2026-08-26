import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPhoneOtp, isSmsConfigured } from '@/lib/sms';

export async function POST(req: NextRequest) {
  let otp = '';
  try {
    const { phone } = await req.json();
    if (!phone || !/^\+?[6-9]\d{9,14}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Valid phone number required (10+ digits)' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    await db.user.updateMany({
      where: { phone: cleanPhone },
      data: { otpSecret: `${otp}:${otpExpiry}` },
    });

    // Try real SMS delivery
    const smsResult = await sendPhoneOtp(cleanPhone, otp);

    if (smsResult.actuallyDelivered) {
      return NextResponse.json({
        message: 'OTP sent to your phone number',
      });
    }

    // SMS provider NOT configured → dev mode
    const smsAvailable = await isSmsConfigured();
    if (!smsAvailable) {
      return NextResponse.json({
        message: 'OTP sent to your phone number (dev mode)',
        devOtp: otp,
      });
    }

    // SMS provider configured but delivery failed (e.g., DLT not done)
    if (smsResult.error) {
      console.warn(`⚠️ SMS delivery failed: ${smsResult.error}`);
      return NextResponse.json({
        message: `OTP sent (sandbox mode)`,
        devOtp: otp,
      });
    }

    return NextResponse.json({
      message: 'OTP sent to your phone number (dev mode)',
      devOtp: otp,
    });
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    const smsAvailable = await isSmsConfigured();
    if (!smsAvailable) {
      return NextResponse.json({
        message: 'OTP sent (dev mode)',
        devOtp: otp,
      });
    }
    console.warn(`⚠️ SMS provider error, falling back to dev mode: ${err.message}`);
    return NextResponse.json({
      message: `OTP sent (sandbox mode)`,
      devOtp: otp,
    });
  }
}
