import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash, randomBytes } from 'crypto';
import { sendBrevoEmail, logEmailToDb, isBrevoConfigured } from '@/lib/brevo';

/**
 * POST /api/auth/send-phone-otp
 * 
 * Generates a 6-digit OTP, stores its hash in the user's otpSecret,
 * and sends it via email as a fallback when Firebase SMS isn't available.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, userId } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
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

    if (!user.email) {
      return NextResponse.json({ error: 'No email associated with this account' }, { status: 400 });
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

    // Send OTP via email
    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;padding:32px 24px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#059669,#10b981);display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-size:24px;color:white;">📱</span>
          </div>
          <h2 style="margin:16px 0 4px;font-size:20px;font-weight:700;color:#111;">Phone Verification</h2>
          <p style="color:#666;font-size:14px;">Verify your phone number on SevaSaathi</p>
        </div>
        <div style="background:#f0fdf4;border:2px dashed #86efac;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="color:#374151;font-size:14px;margin:0 0 8px;">Your verification code is</p>
          <p style="font-size:36px;font-weight:800;letter-spacing:8px;color:#059669;margin:0;font-family:monospace;">${otp}</p>
          <p style="color:#6b7280;font-size:12px;margin:12px 0 0;">This code expires in 10 minutes</p>
        </div>
        <div style="background:#fefce8;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#92400e;">⚠️ This OTP was sent to your email as a fallback for phone verification. Enter it in the phone verification dialog.</p>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">If you didn't request this, you can ignore this email.</p>
      </div>
    `;

    const emailResult = await sendBrevoEmail({
      to: user.email,
      subject: `SevaSaathi Phone Verification Code: ${otp}`,
      html,
    });

    await logEmailToDb({
      to: user.email,
      subject: `Phone Verification OTP: ${otp}`,
      html,
      status: emailResult.success ? 'sent' : 'failed',
      userId: user.id,
      type: 'PHONE_OTP',
      externalId: emailResult.messageId,
      error: emailResult.error,
    });

    if (!emailResult.success) {
      return NextResponse.json({
        error: 'Failed to send OTP email. Please try again or contact support.',
        sent: false,
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'OTP sent to your email address',
      sent: true,
      via: 'email',
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // mask email
    });
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
