/*
 * Firebase Admin — Server Side Only
 * 
 * Since the user's org blocks downloading the private key,
 * we use the Firebase Auth REST API to verify ID tokens.
 * This works without the firebase-admin SDK.
 */

import { getConfigWithFallback } from './config';

/**
 * Check if Firebase is configured (client-side config is sufficient).
 */
export async function isFirebaseConfigured(): Promise<boolean> {
  const apiKey = await getConfigWithFallback('FIREBASE', 'API_KEY', 'FIREBASE_API_KEY');
  const projectId = await getConfigWithFallback('FIREBASE', 'PROJECT_ID', 'FIREBASE_PROJECT_ID');
  return !!(apiKey && projectId);
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

/**
 * Verify a Firebase ID token using the REST API (no private key needed).
 * Calls: https://identitytoolkit.googleapis.com/v1/accounts:lookup
 */
export async function verifyFirebaseToken(idToken: string): Promise<any> {
  const apiKey = await getConfigWithFallback('FIREBASE', 'API_KEY', 'FIREBASE_API_KEY');

  if (!apiKey) {
    throw new Error('Firebase API key not configured');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  const data = await response.json() as any;

  if (!response.ok || !data.users?.length) {
    throw new Error(data.error?.message || 'Invalid or expired Firebase token');
  }

  const user = data.users[0];
  
  // Verify the token isn't disabled
  if (user.disabled) {
    throw new Error('Firebase account is disabled');
  }

  return {
    uid: user.localId,
    phone_number: user.phoneNumber,
    email: user.email,
    verified: true,
  };
}
