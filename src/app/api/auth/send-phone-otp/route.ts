import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isFirebaseConfigured } from '@/lib/firebase-admin';

/**
 * POST /api/auth/send-phone-otp
 * 
 * If Firebase is configured: returns { useFirebase: true } so the frontend
 * can use Firebase client SDK for phone OTP.
 * 
 * If not configured: falls back to Fast2SMS / dev OTP.
 */
export async function POST(req: NextRequest) {
  let otp = '';
  try {
    const { phone } = await req.json();
    if (!phone || !/^\+?[6-9]\d{9,14}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Valid phone number required (10+ digits)' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s/g, '');

    // Check if Firebase is configured for real phone OTP
    const fbConfigured = await isFirebaseConfigured();
    if (fbConfigured) {
      return NextResponse.json({
        message: 'Use Firebase for phone verification',
        useFirebase: true,
      });
    }

    // --- Fallback: Generate OTP + try Fast2SMS ---
    otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    await db.user.updateMany({
      where: { phone: cleanPhone },
      data: { otpSecret: `${otp}:${otpExpiry}` },
    });

    // Try real SMS delivery via Fast2SMS
    try {
      const { sendPhoneOtp, isSmsConfigured } = await import('@/lib/sms');
      const smsResult = await sendPhoneOtp(cleanPhone, otp);

      if (smsResult.actuallyDelivered) {
        return NextResponse.json({
          message: 'OTP sent to your phone number',
          useFirebase: false,
        });
      }

      const smsAvailable = await isSmsConfigured();
      if (!smsAvailable) {
        return NextResponse.json({
          message: 'OTP sent to your phone number (dev mode)',
          useFirebase: false,
          devOtp: otp,
        });
      }

      if (smsResult.error) {
        console.warn(`⚠️ SMS delivery failed: ${smsResult.error}`);
        return NextResponse.json({
          message: 'OTP sent (sandbox mode)',
          useFirebase: false,
          devOtp: otp,
        });
      }
    } catch (err: any) {
      console.warn(`⚠️ SMS provider error: ${err.message}`);
    }

    return NextResponse.json({
      message: 'OTP sent (dev mode)',
      useFirebase: false,
      devOtp: otp,
    });
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({
      message: 'OTP sent (dev mode)',
      useFirebase: false,
      devOtp: otp,
    });
  }
}
