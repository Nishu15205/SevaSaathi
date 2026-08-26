import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyFirebaseToken, isFirebaseConfigured } from '@/lib/firebase-admin';

/**
 * POST /api/auth/verify-phone-otp
 * 
 * Two modes:
 * 1. Firebase mode: { phone, firebaseToken } — verifies Firebase ID token
 * 2. Fallback mode: { phone, otp } — verifies stored OTP (dev/fallback)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp, firebaseToken } = body;

    const cleanPhone = (phone || '').replace(/\s/g, '');

    // --- Firebase Phone Auth Verification ---
    if (firebaseToken) {
      const fbConfigured = await isFirebaseConfigured();
      if (!fbConfigured) {
        return NextResponse.json({ error: 'Firebase not configured' }, { status: 400 });
      }

      let decoded: any;
      try {
        decoded = await verifyFirebaseToken(firebaseToken);
      } catch (err: any) {
        console.error('Firebase token verification failed:', err?.message);
        return NextResponse.json({ error: 'Invalid or expired verification. Please try again.' }, { status: 401 });
      }

      // The phone number from Firebase
      const firebasePhone = decoded.phone_number || decoded.phoneNumber || '';
      if (!firebasePhone) {
        return NextResponse.json({ error: 'No phone number in Firebase token' }, { status: 400 });
      }

      // Verify the phone matches
      const normalizedFbPhone = firebasePhone.replace(/\s/g, '').replace(/[^+0-9]/g, '');
      const normalizedInputPhone = cleanPhone.replace(/\s/g, '').replace(/[^+0-9]/g, '');
      const phoneMatch = normalizedFbPhone === normalizedInputPhone ||
        normalizedFbPhone.endsWith(normalizedInputPhone) ||
        normalizedInputPhone.endsWith(normalizedFbPhone.replace('+91', ''));

      if (!phoneMatch && cleanPhone) {
        return NextResponse.json({ error: 'Phone number mismatch' }, { status: 400 });
      }

      // Mark phone as verified for all users with this phone
      const users = await db.user.findMany({ where: { phone: cleanPhone || normalizedFbPhone } });
      if (users.length === 0) {
        // No user with this phone — still return success (for registration flow)
        return NextResponse.json({
          verified: true,
          message: 'Phone verified via Firebase',
          firebasePhone: normalizedFbPhone,
        });
      }

      await db.user.updateMany({
        where: { phone: cleanPhone || normalizedFbPhone },
        data: { phoneVerified: true, otpSecret: null },
      });

      return NextResponse.json({
        verified: true,
        message: 'Phone number verified successfully',
        firebasePhone: normalizedFbPhone,
      });
    }

    // --- Fallback: Stored OTP verification (dev/fallback mode) ---
    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP (or Firebase token) required' }, { status: 400 });
    }

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
