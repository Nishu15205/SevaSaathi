import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyFirebaseToken, isFirebaseConfigured } from '@/lib/firebase-admin';
import { createHash } from 'crypto';

/**
 * POST /api/auth/verify-phone-otp
 * 
 * Accepts either:
 * 1. firebaseToken — Firebase phone auth verification
 * 2. otp — Email-sent OTP verification (fallback)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, firebaseToken, otp } = body;
    const cleanPhone = (phone || '').replace(/\s/g, '').replace(/[^+0-9]/g, '');

    // --- Path 1: Firebase token verification ---
    if (firebaseToken) {
      const fbConfigured = await isFirebaseConfigured();
      if (!fbConfigured) {
        return NextResponse.json({ error: 'Phone verification service is not configured' }, { status: 503 });
      }

      let decoded: any;
      try {
        decoded = await verifyFirebaseToken(firebaseToken);
      } catch (err: any) {
        console.error('Firebase token verification failed:', err?.message);
        return NextResponse.json({ error: 'Invalid or expired verification. Please try again.' }, { status: 401 });
      }

      const firebasePhone = decoded.phone_number || decoded.phoneNumber || '';
      if (!firebasePhone) {
        return NextResponse.json({ error: 'No phone number in Firebase token' }, { status: 400 });
      }

      const normalizedFbPhone = firebasePhone.replace(/\s/g, '').replace(/[^+0-9]/g, '');
      const phoneMatch = !cleanPhone ||
        normalizedFbPhone === cleanPhone ||
        normalizedFbPhone.endsWith(cleanPhone) ||
        cleanPhone.endsWith(normalizedFbPhone.replace('+91', ''));

      if (!phoneMatch) {
        return NextResponse.json({ error: 'Phone number mismatch' }, { status: 400 });
      }

      await markPhoneVerified(cleanPhone || normalizedFbPhone);

      return NextResponse.json({ verified: true, message: 'Phone number verified successfully' });
    }

    // --- Path 2: Email OTP verification (fallback) ---
    if (otp) {
      if (!cleanPhone) {
        return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
      }

      const user = await db.user.findFirst({ where: { phone: cleanPhone } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!user.otpSecret) {
        return NextResponse.json({ error: 'No OTP was sent. Please request a new one.' }, { status: 400 });
      }

      // Parse stored value: salt:hash:expiryTimestamp
      const parts = user.otpSecret.split(':');
      if (parts.length !== 3) {
        return NextResponse.json({ error: 'Invalid OTP data. Please request a new one.' }, { status: 400 });
      }

      const [salt, storedHash, expiryStr] = parts;
      const expiry = parseInt(expiryStr, 10);

      // Check expiry
      if (Date.now() > expiry) {
        await db.user.update({ where: { id: user.id }, data: { otpSecret: null } });
        return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
      }

      // Verify OTP
      const computedHash = createHash('sha256').update(salt + otp).digest('hex');
      if (computedHash !== storedHash) {
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
      }

      // Clear OTP and mark verified
      await db.user.update({
        where: { id: user.id },
        data: { phoneVerified: true, otpSecret: null },
      });

      // Auto-check caregiver verification
      await autoGrantVerifiedBadge(user.id);

      return NextResponse.json({ verified: true, message: 'Phone number verified successfully' });
    }

    // Neither token nor OTP provided
    return NextResponse.json({ error: 'Please provide verification code' }, { status: 400 });
  } catch (err: any) {
    console.error('Verify phone OTP error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

async function markPhoneVerified(phone: string) {
  const users = await db.user.findMany({ where: { phone } });
  if (users.length > 0) {
    await db.user.updateMany({
      where: { phone },
      data: { phoneVerified: true, otpSecret: null },
    });
    for (const u of users) {
      await autoGrantVerifiedBadge(u.id);
    }
  }
}

async function autoGrantVerifiedBadge(userId: string) {
  const caregiver = await db.caregiver.findUnique({ where: { userId } });
  if (caregiver && !caregiver.isVerified) {
    const verifications = await db.verification.findMany({ where: { caregiverId: caregiver.id } });
    const allDocsApproved = verifications.length > 0 && verifications.every(d => d.status === 'APPROVED');
    if (allDocsApproved) {
      await db.caregiver.update({
        where: { id: caregiver.id },
        data: { isVerified: true },
      });
      await db.notification.create({
        data: {
          userId,
          type: 'VERIFICATION_UPDATE',
          title: 'You are now a Verified Caregiver!',
          message: 'Your phone number has been verified and all documents are approved. You now have the verified caregiver badge with higher visibility!',
          data: null,
        },
      });
    }
  }
}
