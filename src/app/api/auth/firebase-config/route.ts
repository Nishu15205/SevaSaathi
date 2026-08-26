import { NextResponse } from 'next/server';
import { getFirebaseClientConfig, isFirebaseConfigured } from '@/lib/firebase-admin';

/**
 * GET /api/auth/firebase-config
 * Returns public Firebase config for client-side initialization.
 * Does NOT expose private keys.
 */
export async function GET() {
  try {
    const configured = await isFirebaseConfigured();
    const clientConfig = await getFirebaseClientConfig();

    return NextResponse.json({
      configured,
      ...clientConfig,
    });
  } catch (error: any) {
    console.error('Firebase config error:', error);
    return NextResponse.json({ configured: false }, { status: 200 });
  }
}
