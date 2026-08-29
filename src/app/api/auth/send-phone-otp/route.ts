import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseConfigured } from '@/lib/firebase-admin';

/**
 * POST /api/auth/send-phone-otp
 * 
 * Checks if Firebase is configured for real phone OTP.
 * The actual OTP is sent by the Firebase client SDK on the frontend.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || !/^\+?[6-9]\d{9,14}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Valid phone number required (10+ digits)' }, { status: 400 });
    }

    const fbConfigured = await isFirebaseConfigured();
    if (!fbConfigured) {
      return NextResponse.json({ error: 'Phone verification service is not configured. Please contact support.' }, { status: 503 });
    }

    return NextResponse.json({
      message: 'Use Firebase for phone verification',
      useFirebase: true,
    });
  } catch (err: any) {
    console.error('Send phone OTP error:', err);
    return NextResponse.json({ error: 'Failed to initiate phone verification' }, { status: 500 });
  }
}
