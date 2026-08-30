import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash, randomBytes } from 'crypto';
import { sendPhoneOtp, isSmsConfigured, type SmsResult } from '@/lib/sms';

/** Rate-limit map: phone → last sent timestamp */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000; // 1 minute between sends

/**
 * POST /api/auth/send-phone-otp
 * 
 * Generates a 6-digit OTP, stores its hash in the user's otpSecret,
 * and sends it via Fast2SMS.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, userId } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Rate limit check
    const now = Date.now();
    const lastSent = rateLimitMap.get(phone);
    if (lastSent && now - lastSent < RATE_LIMIT_MS) {
      const waitSecs = Math.ceil((RATE_LIMIT_MS - (now - lastSent)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSecs} seconds before requesting another OTP` },
        { status: 429 }
      );
    }

    // Find user by phone
    const cleanPhone = phone.replace(/\s/g, '').replace(/[^+0-9]/g, '');
    const user = await db.user.findFirst({
      where: { phone: cleanPhone },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found with this phone number' }, { status: 404 });
    }

    if (user.phoneVerified) {
      return NextResponse.json({ error: 'Phone number is already verified' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash the OTP with a salt for storage
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(salt + otp).digest('hex');
    const storedValue = `${salt}:${hash}:${otpExpiry.getTime()}`;

    // Store in user's otpSecret
    await db.user.update({
      where: { id: user.id },
      data: { otpSecret: storedValue },
    });

    // Update rate limit
    rateLimitMap.set(phone, now);
    // Cleanup old entries periodically
    if (rateLimitMap.size > 1000) {
      for (const [key, ts] of rateLimitMap.entries()) {
        if (now - ts > RATE_LIMIT_MS * 5) rateLimitMap.delete(key);
      }
    }

    // Send OTP via Fast2SMS
    const smsResult: SmsResult = await sendPhoneOtp(cleanPhone, otp);

    if (smsResult.success) {
      if (smsResult.actuallyDelivered) {
        console.log(`📱 OTP sent via Fast2SMS to ${cleanPhone}`);
        return NextResponse.json({
          message: 'OTP sent to your phone via SMS',
          sent: true,
          via: 'sms',
        });
      } else {
        // Dev mode — no API key configured, OTP logged to console
        console.log(`\n📱 ===== DEV MODE =====`);
        console.log(`   PHONE: ${cleanPhone}`);
        console.log(`   OTP:   ${otp}`);
        console.log(`   Add FAST2SMS_API_KEY to .env or Admin > Credentials for real SMS delivery`);
        console.log(`=======================\n`);
        return NextResponse.json({
          message: 'OTP generated (dev mode — check server console)',
          sent: true,
          via: 'dev',
          devOtp: otp, // Only returned in dev mode for testing
        });
      }
    } else {
      // Fast2SMS returned a DLT/account error
      const errMsg = smsResult.error || 'SMS delivery failed';
      console.error(`📱 Fast2SMS delivery failed for ${cleanPhone}: ${errMsg}`);
      return NextResponse.json(
        { error: `Failed to send SMS: ${errMsg}. Please contact support.` },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
