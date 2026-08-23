import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPhoneOtp } from '@/lib/sms';

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
      // Real SMS was successfully sent
      return NextResponse.json({
        message: 'OTP sent to your phone number',
      });
    }

    // SMS was NOT actually delivered (no key, or Fast2SMS failed)
    // Return devOtp so testing can still work
    return NextResponse.json({
      message: smsResult.error 
        ? `OTP ready (SMS not delivered: ${smsResult.error}). Use the OTP below to verify.`
        : 'OTP sent to your phone number (dev mode)',
      devOtp: otp,
    });
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
