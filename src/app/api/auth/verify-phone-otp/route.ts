import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';
import { verifyViaMsg91Otp, getVerificationMode } from '@/lib/sms';

/**
 * POST /api/auth/verify-phone-otp
 * 
 * Three paths:
 * 1. firebaseToken — Firebase phone auth (legacy)
 * 2. otp + msg91 mode — Verify via MSG91's verify endpoint (MSG91 generated OTP)
 * 3. otp + db/dev mode — Verify against hashed OTP in DB (our generated OTP)
 * 
 * Also: if MSG91 verify fails, fall back to DB hash (in case SMS didn't arrive
 * and user used the fallback OTP shown in UI)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, firebaseToken, otp } = body;
    const cleanPhone = (phone || '').replace(/\s/g, '').replace(/[^+0-9]/g, '');

    // --- Path 1: Firebase token verification (legacy) ---
    if (firebaseToken) {
      return await verifyViaFirebase(firebaseToken, cleanPhone);
    }

    // --- Path 2 & 3: OTP verification ---
    if (otp) {
      if (!cleanPhone) {
        return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
      }

      const mode = await getVerificationMode();

      // MSG91 mode: try MSG91 verify first, fallback to DB hash
      if (mode === 'msg91') {
        return await verifyViaMsg91WithFallback(cleanPhone, otp);
      }

      // DB/Dev mode: verify against hash in DB
      return await verifyViaDb(cleanPhone, otp);
    }

    return NextResponse.json({ error: 'Please provide verification code' }, { status: 400 });
  } catch (err: any) {
    console.error('Verify phone OTP error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

// --- MSG91 Verification with DB fallback ---
async function verifyViaMsg91WithFallback(phone: string, otp: string) {
  const { getMsg91AuthKey } = await import('@/lib/config');
  const authKey = await getMsg91AuthKey();

  // Try MSG91 verify first (4-digit OTP from SMS)
  if (authKey) {
    const isValid = await verifyViaMsg91Otp(phone, otp, authKey);
    if (isValid) {
      await markPhoneVerified(phone);
      return NextResponse.json({ verified: true, message: 'Phone number verified successfully!' });
    }
  }

  // Fallback: try DB hash (6-digit fallback OTP shown in UI)
  const dbResult = await verifyViaDb(phone, otp);
  // If DB verify succeeds, great. If not, return generic error
  // (don't reveal that we tried two methods)
  if (dbResult.status === 200) return dbResult;

  return NextResponse.json(
    { error: 'Invalid OTP. Check your SMS or use the OTP shown on screen.' },
    { status: 400 }
  );
}

// --- DB Hash Verification ---
async function verifyViaDb(phone: string, otp: string) {
  const user = await db.user.findFirst({ where: { phone } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.otpSecret) {
    return NextResponse.json({ error: 'No OTP was sent. Please request a new one.' }, { status: 400 });
  }

  const parts = user.otpSecret.split(':');
  if (parts.length !== 3) {
    return NextResponse.json({ error: 'Invalid OTP data. Please request a new one.' }, { status: 400 });
  }

  const [salt, storedHash, expiryStr] = parts;
  const expiry = parseInt(expiryStr, 10);

  if (Date.now() > expiry) {
    await db.user.update({ where: { id: user.id }, data: { otpSecret: null } });
    return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
  }

  const computedHash = createHash('sha256').update(salt + otp).digest('hex');
  if (computedHash !== storedHash) {
    return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { phoneVerified: true, otpSecret: null },
  });

  await autoGrantVerifiedBadge(user.id);
  return NextResponse.json({ verified: true, message: 'Phone number verified successfully!' });
}

// --- Firebase (Legacy) ---
async function verifyViaFirebase(firebaseToken: string, cleanPhone: string) {
  const { isFirebaseConfigured, verifyFirebaseToken } = await import('@/lib/firebase-admin');

  const fbConfigured = await isFirebaseConfigured();
  if (!fbConfigured) {
    return NextResponse.json({ error: 'Phone verification service is not configured' }, { status: 503 });
  }

  let decoded: any;
  try {
    decoded = await verifyFirebaseToken(firebaseToken);
  } catch (err: any) {
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
  return NextResponse.json({ verified: true, message: 'Phone number verified successfully!' });
}

// --- Shared ---
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
