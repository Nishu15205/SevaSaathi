import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash, randomBytes } from 'crypto';
import { sendPhoneOtp, isSmsConfigured } from '@/lib/sms';

/** Rate-limit map: phone → last sent timestamp */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

/**
 * POST /api/auth/send-phone-otp
 *
 * Single clean path:
 * 1. Generate 6-digit OTP
 * 2. Store salted hash in DB (for verification)
 * 3. Send via Fast2SMS (if configured) or dev mode
 * 4. Return OTP in response so UI can show it as fallback if SMS doesn't arrive
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

    // Step 1: Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Step 2: Store salted hash in DB (10 min expiry)
    const otpExpiry = Date.now() + 10 * 60 * 1000;
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(salt + otp).digest('hex');
    await db.user.update({
      where: { id: user.id },
      data: { otpSecret: `${salt}:${hash}:${otpExpiry}` },
    });

    // Update rate limit
    rateLimitMap.set(phone, now);
    if (rateLimitMap.size > 1000) {
      for (const [key, ts] of rateLimitMap.entries()) {
        if (now - ts > RATE_LIMIT_MS * 5) rateLimitMap.delete(key);
      }
    }

    // Step 3: Send via Fast2SMS (or dev mode)
    const smsConfigured = await isSmsConfigured();
    const smsResult = await sendPhoneOtp(cleanPhone, otp);

    // Step 4: Return response
    if (smsResult.delivered) {
      // SMS sent successfully via Fast2SMS
      console.log(`✅ Real OTP sent to ${cleanPhone} via Fast2SMS`);
      return NextResponse.json({
        message: 'OTP sent to your phone via SMS!',
        sent: true,
        via: 'sms',
        otp,  // Always return OTP so user can use it as fallback if SMS is delayed
      });
    }

    if (smsConfigured && !smsResult.delivered) {
      // Fast2SMS is configured but delivery failed
      console.error(`❌ Fast2SMS configured but failed: ${smsResult.error}`);
      return NextResponse.json({
        message: `SMS delivery failed (${smsResult.error}). Use the OTP below.`,
        sent: true,
        via: 'dev',
        otp,
      });
    }

    // Dev mode — no SMS configured
    console.log(`📱 DEV MODE — PHONE: ${cleanPhone}, OTP: ${otp}`);
    return NextResponse.json({
      message: 'OTP generated (configure Fast2SMS API key in Admin Settings for real SMS delivery)',
      sent: true,
      via: 'dev',
      otp,
    });
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
