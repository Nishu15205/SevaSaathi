import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash, randomBytes } from 'crypto';
import { sendPhoneOtp, getVerificationMode, isSmsConfigured } from '@/lib/sms';

/** Rate-limit map: phone → last sent timestamp */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

/**
 * POST /api/auth/send-phone-otp
 * 
 * Smart dual approach:
 * 1. Always generate a 6-digit fallback OTP (stored in DB hash)
 * 2. If MSG91 configured: let MSG91 send its own OTP via their DLT template
 * 3. Return both modes' info so frontend can show fallback if SMS doesn't arrive
 * 4. Verification route auto-detects which mode to use
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

    // Always generate our own 6-digit OTP (used as fallback & for db/dev verification)
    const fallbackOtp = String(Math.floor(100000 + Math.random() * 900000));

    // Always store our fallback OTP hash in DB (used for dev/db mode verification)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(salt + fallbackOtp).digest('hex');
    await db.user.update({
      where: { id: user.id },
      data: { otpSecret: `${salt}:${hash}:${otpExpiry.getTime()}` },
    });

    // Update rate limit
    rateLimitMap.set(phone, now);
    if (rateLimitMap.size > 1000) {
      for (const [key, ts] of rateLimitMap.entries()) {
        if (now - ts > RATE_LIMIT_MS * 5) rateLimitMap.delete(key);
      }
    }

    // Dev mode — no MSG91 configured
    if (mode === 'dev') {
      console.log(`\n📱 DEV MODE — PHONE: ${cleanPhone}, OTP: ${fallbackOtp}`);
      return NextResponse.json({
        message: 'OTP generated (dev mode)',
        sent: true, via: 'dev', devOtp: fallbackOtp,
      });
    }

    // Try MSG91 delivery
    try {
      const smsResult = await sendPhoneOtp(cleanPhone, fallbackOtp);

      if (smsResult.success) {
        if (mode === 'msg91') {
          // MSG91 generated its own 4-digit OTP
          console.log(`📱 MSG91 sent OTP to ${cleanPhone} (check phone for 4-digit OTP)`);
          // Always return fallback OTP too in case SMS doesn't arrive
          return NextResponse.json({
            message: 'OTP sent to your phone via SMS!',
            sent: true, via: 'msg91',
            fallbackOtp,  // 6-digit fallback visible in UI
          });
        }

        // Flow API: our OTP was sent via MSG91
        console.log(`📱 OTP sent via MSG91 Flow to ${cleanPhone}`);
        return NextResponse.json({
          message: 'OTP sent to your phone via SMS!',
          sent: true, via: 'sms', devOtp: fallbackOtp,
        });
      }

      // MSG91 failed — show fallback OTP
      const errMsg = smsResult.error || 'SMS delivery failed';
      console.error(`📱 SMS failed for ${cleanPhone}: ${errMsg}`);
      return NextResponse.json({
        message: `SMS failed. Use the OTP shown below.`,
        sent: true, via: 'dev', devOtp: fallbackOtp,
      });
    } catch (err: any) {
      // MSG91 threw error — show fallback OTP
      console.error(`📱 SMS error for ${cleanPhone}: ${err.message}`);
      return NextResponse.json({
        message: `SMS error. Use the OTP shown below.`,
        sent: true, via: 'dev', devOtp: fallbackOtp,
      });
    }
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
