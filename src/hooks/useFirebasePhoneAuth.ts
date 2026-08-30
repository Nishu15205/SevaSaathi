"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';

const APP_NAME = 'phone-auth';

interface UseFirebasePhoneAuthReturn {
  isReady: boolean;
  codeSent: boolean;
  sendingOtp: boolean;
  verifying: boolean;
  error: string;
  /** Send OTP — returns true on success, or error string on failure */
  sendOtp: (phone: string, recaptchaContainerId?: string) => Promise<true | string>;
  verifyOtp: (code: string) => Promise<{ firebaseToken: string } | null>;
  reset: () => void;
}

function getErrorDetails(err: any): { code: string; message: string } {
  const code = err?.code || '';
  const message = err?.message || err?.toString?.() || String(err) || 'Unknown error';
  return { code, message };
}

export function useFirebasePhoneAuth(): UseFirebasePhoneAuthReturn {
  const [isReady, setIsReady] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const authRef = useRef<any>(null);
  const recaptchaRef = useRef<any>(null);

  // Initialize Firebase on mount (only once)
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const res = await fetch('/api/auth/firebase-config');
        const data = await res.json();

        if (!data.configured || !data.apiKey) {
          console.log('firebase-phone-auth: not configured');
          setIsReady(false);
          return;
        }

        let app;
        const existing = getApps().find(a => a.name === APP_NAME);
        if (existing) {
          app = existing;
        } else {
          app = initializeApp({
            apiKey: data.apiKey,
            authDomain: data.authDomain,
            projectId: data.projectId,
          }, APP_NAME);
        }

        authRef.current = getAuth(app);
        if (mounted) setIsReady(true);
      } catch (err: any) {
        console.error('Firebase init error:', err);
        if (mounted) setIsReady(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  /**
   * Build a friendly error string from the raw Firebase error.
   * Returns 'operation-not-allowed' as an exact identifier for the UI guide.
   */
  function classifyError(err: any): string {
    const { code, message } = getErrorDetails(err);
    const t = (code + ' ' + message).toLowerCase();

    if (t.includes('operation-not-allowed') || t.includes('not-allowed')) return 'operation-not-allowed';
    if (t.includes('too-many') || t.includes('too many')) return 'Too many OTP attempts. Please wait a few minutes and try again.';
    if (t.includes('recaptcha') || t.includes('captcha')) return 'Security check (reCAPTCHA) failed. Please refresh the page and try again.';
    if (t.includes('invalid-phone') || t.includes('malformed')) return 'This phone number format is not supported. Please check and try again.';
    if (t.includes('network') || t.includes('fetch') || t.includes('timeout')) return 'Network error. Please check your internet connection and try again.';
    return message || 'Failed to send OTP';
  }

  const sendOtp = useCallback(async (phone: string, recaptchaContainerId: string = 'recaptcha-container'): Promise<true | string> => {
    if (!authRef.current) {
      const msg = 'Firebase not initialized';
      setError(msg);
      return msg;
    }

    setSendingOtp(true);
    setError('');

    try {
      // Clean up existing recaptcha
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch {}
        recaptchaRef.current = null;
      }

      // Remove old container if it exists
      const oldContainer = document.getElementById(recaptchaContainerId);
      if (oldContainer) oldContainer.remove();

      // Create fresh container
      const container = document.createElement('div');
      container.id = recaptchaContainerId;
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.zIndex = '-1';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);

      const recaptchaVerifier = new RecaptchaVerifier(authRef.current, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          console.error('firebase-phone-auth: reCAPTCHA expired');
          setError('Security check expired. Please try again.');
        },
        'error-callback': (err: any) => {
          console.error('firebase-phone-auth: reCAPTCHA error', err);
        },
      });

      recaptchaRef.current = recaptchaVerifier;

      // Format phone — keep as-is if already has country code
      let formattedPhone = phone.replace(/\s/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone;
      }

      console.log('firebase-phone-auth: sending OTP to', formattedPhone);

      await recaptchaVerifier.render();
      const confirmationResult = await signInWithPhoneNumber(authRef.current, formattedPhone, recaptchaVerifier);
      confirmationRef.current = confirmationResult;
      setCodeSent(true);
      return true;
    } catch (err: any) {
      console.error('Firebase send OTP error:', err);
      const friendlyMsg = classifyError(err);
      setError(friendlyMsg);
      setCodeSent(false);
      return friendlyMsg;          // ← return error string directly (synchronous!)
    } finally {
      setSendingOtp(false);
    }
  }, []);

  const verifyOtp = useCallback(async (code: string): Promise<{ firebaseToken: string } | null> => {
    if (!confirmationRef.current) {
      setError('No OTP was sent. Please request a new one.');
      return null;
    }

    setVerifying(true);
    setError('');

    try {
      const result = await confirmationRef.current.confirm(code);
      const token = await result.user.getIdToken();
      return { firebaseToken: token };
    } catch (err: any) {
      console.error('Firebase verify OTP error:', err);
      const { message } = getErrorDetails(err);
      setError(message.includes('invalid-verification-code')
        ? 'Invalid OTP. Please check and try again.'
        : message);
      return null;
    } finally {
      setVerifying(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCodeSent(false);
    setSendingOtp(false);
    setVerifying(false);
    setError('');
    confirmationRef.current = null;
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch {}
      recaptchaRef.current = null;
    }
  }, []);

  return { isReady, codeSent, sendingOtp, verifying, error, sendOtp, verifyOtp, reset };
}
