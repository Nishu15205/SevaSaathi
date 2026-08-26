/**
 * Firebase Admin SDK — Server Side Only
 * 
 * Used to:
 * 1. Verify Firebase ID tokens from phone auth
 * 2. Get user info from verified tokens
 * 
 * NEVER import this in client components.
 */

import { getConfigWithFallback } from './config';

let cachedAdmin: any = null;

/**
 * Get Firebase Admin instance (lazy-initialized).
 * Reads credentials from system_configs DB or env vars.
 */
export async function getFirebaseAdmin() {
  if (cachedAdmin) return cachedAdmin;

  // Dynamic import — only loads on server
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');

  const projectId = await getConfigWithFallback('FIREBASE', 'PROJECT_ID', 'FIREBASE_PROJECT_ID');
  const privateKey = await getConfigWithFallback('FIREBASE', 'PRIVATE_KEY', 'FIREBASE_PRIVATE_KEY');
  const clientEmail = await getConfigWithFallback('FIREBASE', 'CLIENT_EMAIL', 'FIREBASE_CLIENT_EMAIL');

  if (!projectId || !privateKey || !clientEmail) {
    console.warn('\n🔥 Firebase Admin not configured');
    console.warn('   Add FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL\n');
    return null;
  }

  // Handle escaped newlines in private key (common when stored in DB/env)
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  if (!getApps().length) {
    const app = initializeApp({
      credential: cert({ projectId, privateKey: formattedKey, clientEmail }),
    });
    cachedAdmin = getAuth(app);
  } else {
    cachedAdmin = getAuth();
  }

  return cachedAdmin;
}

/**
 * Check if Firebase is configured.
 */
export async function isFirebaseConfigured(): Promise<boolean> {
  const projectId = await getConfigWithFallback('FIREBASE', 'PROJECT_ID', 'FIREBASE_PROJECT_ID');
  const privateKey = await getConfigWithFallback('FIREBASE', 'PRIVATE_KEY', 'FIREBASE_PRIVATE_KEY');
  const clientEmail = await getConfigWithFallback('FIREBASE', 'CLIENT_EMAIL', 'FIREBASE_CLIENT_EMAIL');
  return !!(projectId && privateKey && clientEmail);
}

/**
 * Verify a Firebase ID token and return decoded user info.
 */
export async function verifyFirebaseToken(idToken: string): Promise<any> {
  const admin = await getFirebaseAdmin();
  if (!admin) throw new Error('Firebase Admin not configured');

  const decoded = await admin.verifyIdToken(idToken);
  return decoded;
}

/**
 * Get Firebase client config for the frontend.
 * Returns only public-safe values (no private key).
 */
export async function getFirebaseClientConfig(): Promise<{
  configured: boolean;
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
} | null> {
  const apiKey = await getConfigWithFallback('FIREBASE', 'API_KEY', 'FIREBASE_API_KEY');
  const authDomain = await getConfigWithFallback('FIREBASE', 'AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN');
  const projectId = await getConfigWithFallback('FIREBASE', 'PROJECT_ID', 'FIREBASE_PROJECT_ID');

  if (!apiKey || !projectId) return null;

  return {
    configured: true,
    apiKey,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    projectId,
  };
}
