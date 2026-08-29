import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyFirebaseToken, isFirebaseConfigured } from '@/lib/firebase-admin';

/**
 * POST /api/auth/verify-phone-otp
 * 
 * Only accepts Firebase token verification.
 * The user must have received a real OTP on their phone and entered it
 * in the Firebase client SDK. The resulting ID token is sent here.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, firebaseToken } = body;

    if (!firebaseToken) {
      return NextResponse.json({ error: 'Firebase verification token required. Please enter the OTP sent to your phone.' }, { status: 400 });
    }

    const fbConfigured = await isFirebaseConfigured();
    if (!fbConfigured) {
      return NextResponse.json({ error: 'Phone verification service is not configured' }, { status: 503 });
    }

    // Verify the Firebase token
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
    const cleanPhone = (phone || '').replace(/\s/g, '');
    const normalizedFbPhone = firebasePhone.replace(/\s/g, '').replace(/[^+0-9]/g, '');
    const normalizedInputPhone = cleanPhone.replace(/[^+0-9]/g, '');
    const phoneMatch = normalizedFbPhone === normalizedInputPhone ||
      normalizedFbPhone.endsWith(normalizedInputPhone) ||
      normalizedInputPhone.endsWith(normalizedFbPhone.replace('+91', ''));

    if (!phoneMatch && cleanPhone) {
      return NextResponse.json({ error: 'Phone number mismatch' }, { status: 400 });
    }

    // Mark phone as verified for all users with this phone
    const users = await db.user.findMany({ where: { phone: cleanPhone || normalizedFbPhone } });
    if (users.length > 0) {
      await db.user.updateMany({
        where: { phone: cleanPhone || normalizedFbPhone },
        data: { phoneVerified: true, otpSecret: null },
      });

      // Auto-check: if phone verified now, check if caregiver docs are all approved
      for (const u of users) {
        const caregiver = await db.caregiver.findUnique({ where: { userId: u.id } });
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
                userId: u.id,
                type: 'VERIFICATION_UPDATE',
                title: 'You are now a Verified Caregiver!',
                message: 'Your phone number has been verified and all documents are approved. You now have the verified caregiver badge with higher visibility!',
                data: null,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      verified: true,
      message: 'Phone number verified successfully',
      firebasePhone: normalizedFbPhone,
    });
  } catch (err: any) {
    console.error('Verify phone OTP error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
