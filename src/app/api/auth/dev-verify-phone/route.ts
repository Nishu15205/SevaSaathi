import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/auth/dev-verify-phone
 * 
 * Development-only endpoint: marks a phone number as verified
 * without actual OTP. Only works when NEXTAUTH_URL includes localhost.
 */
export async function POST(req: NextRequest) {
  try {
    // Security: only allow in development
    const url = process.env.NEXTAUTH_URL || '';
    const host = req.headers.get('host') || '';
    const isDev = url.includes('localhost') || host.includes('localhost') || process.env.NODE_ENV === 'development';
    
    if (!isDev) {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const { phone } = await req.json();
    const cleanPhone = (phone || '').replace(/\s/g, '').replace(/[^+0-9]/g, '');
    if (!cleanPhone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const users = await db.user.findMany({ where: { phone: cleanPhone } });
    if (users.length === 0) {
      return NextResponse.json({ error: 'No user found with this phone number' }, { status: 404 });
    }

    await db.user.updateMany({
      where: { phone: cleanPhone },
      data: { phoneVerified: true, otpSecret: null },
    });

    // Auto-grant verified badge if all docs are approved
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
              message: 'Your phone number has been verified and all documents are approved. You now have the verified caregiver badge!',
              data: null,
            },
          });
        }
      }
    }

    return NextResponse.json({ verified: true, message: 'Phone verified (dev mode)' });
  } catch (err: any) {
    console.error('Dev verify phone error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
