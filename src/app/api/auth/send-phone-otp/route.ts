import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash, randomBytes } from 'crypto';
import { sendPhoneOtp, getVerificationMode } from '@/lib/sms';

/** Rate-limit map: phone → last sent timestamp */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

/**
 * POST /api/auth/send-phone-otp
 * 
 * Two modes:
 * - MSG91 OTP API: MSG91 generates & sends OTP, verification via MSG91
 * - Dev/Flow: We generate OTP, store hash in DB, verification via DB
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, userId } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Rate limit
    const now = Date.now();
    const lastSent = rateLimitMap.get(phone);
    if (lastSent && now - lastSent < RATE_LIMIT_MS) {
      const waitSecs = Math.ceil((RATE_LIMIT_MS - (now - lastSent)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSecs} seconds before requesting another OTP` },
        { status: 429 }
      );
    }

    const cleanPhone = phone.replace(/\s/g, '').replace(/[^+0-9]/g, '');
    const user = await db.user.findFirst({ where: { phone: cleanPhone } });

    if (!user) {
      return NextResponse.json({ error: 'User not found with this phone number' }, { status: 404 });
    }

    if (user.phoneVerified) {
      return NextResponse.json({ error: 'Phone number is already verified' }, { status: 400 });
    }

    const mode = await getVerificationMode();

    // Generate our OTP (used in dev mode and Flow API mode)
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // For dev/db mode, store hash in DB
    if (mode === 'dev' || mode === 'db') {
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      const salt = randomBytes(16).toString('hex');
      const hash = createHash('sha256').update(salt + otp).digest('hex');
      await db.user.update({
        where: { id: user.id },
        data: { otpSecret: `${salt}:${hash}:${otpExpiry.getTime()}` },
      });
    }

    // Update rate limit
    rateLimitMap.set(phone, now);
    if (rateLimitMap.size > 1000) {
      for (const [key, ts] of rateLimitMap.entries()) {
        if (now - ts > RATE_LIMIT_MS * 5) rateLimitMap.delete(key);
      }
    }

    const smsResult = await sendPhoneOtp(cleanPhone, otp);

    if (smsResult.success) {
      if (mode === 'dev') {
        console.log(`\n📱 ===== DEV MODE =====`);
        console.log(`   PHONE: ${cleanPhone}`);
        console.log(`   OTP:   ${otp}`);
        console.log(`=======================\n`);
        return NextResponse.json({
          message: 'OTP generated (dev mode)',
          sent: true, via: 'dev', devOtp: otp,
        });
      }

      // MSG91 OTP API mode: MSG91 sent its own OTP
      if (mode === 'msg91') {
        console.log(`📱 OTP sent via MSG91 (MSG91-generated) to ${cleanPhone}`);
        return NextResponse.json({
          message: 'OTP sent to your phone via SMS',
          sent: true, via: 'msg91',
        });
      }

      // Flow API mode: we sent our OTP via MSG91
      console.log(`📱 OTP sent via MSG91 Flow to ${cleanPhone}`);
      return NextResponse.json({
        message: 'OTP sent to your phone via SMS',
        sent: true, via: 'sms',
      });
    }

    const errMsg = smsResult.error || 'SMS delivery failed';
    console.error(`📱 SMS failed for ${cleanPhone}: ${errMsg}`);
    return NextResponse.json(
      { error: `Failed to send SMS: ${errMsg}. Please contact support.` },
      { status: 503 }
    );
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
