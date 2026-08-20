import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const users = await db.user.findMany({ where: { phone: cleanPhone } });
    if (users.length === 0) {
      return NextResponse.json({ error: 'No account found with this phone number' }, { status: 404 });
    }

    const user = users[0];
    if (!user.otpSecret) {
      return NextResponse.json({ error: 'No OTP was sent. Please request a new OTP.' }, { status: 400 });
    }

    const parts = user.otpSecret.split(':');
    const storedOtp = parts[0];
    const expiry = parseInt(parts[1], 10);

    if (Date.now() > expiry) {
      await db.user.update({ where: { id: user.id }, data: { otpSecret: null } });
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (storedOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { phoneVerified: true, otpSecret: null },
    });

    return NextResponse.json({ verified: true, message: 'Phone number verified successfully' });
  } catch (err: any) {
    console.error('Verify phone OTP error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
