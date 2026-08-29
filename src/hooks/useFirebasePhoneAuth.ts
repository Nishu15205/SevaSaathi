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
  sendOtp: (phone: string, recaptchaContainerId?: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<{ firebaseToken: string } | null>;
  reset: () => void;
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

        // Check if already initialized (survives tab switch / remount)
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

  const sendOtp = useCallback(async (phone: string, recaptchaContainerId: string = 'recaptcha-container'): Promise<boolean> => {
    if (!authRef.current) {
      setError('Firebase not initialized');
      return false;
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
      });

      recaptchaRef.current = recaptchaVerifier;

      // Format phone number for Firebase
      let formattedPhone = phone.replace(/\s/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone;
      }

      console.log('firebase-phone-auth: sending OTP to', formattedPhone);
      const confirmationResult = await signInWithPhoneNumber(authRef.current, formattedPhone, recaptchaVerifier);
      confirmationRef.current = confirmationResult;
      setCodeSent(true);
      return true;
    } catch (err: any) {
      console.error('Firebase send OTP error:', err);
      const msg = err?.message || 'Failed to send OTP';
      setError(msg.includes('too-many')
        ? 'Too many attempts. Please try again later.'
        : msg.includes('reCAPTCHA')
          ? 'reCAPTCHA verification failed. Please refresh and try again.'
          : msg);
      setCodeSent(false);
      return false;
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
      const msg = err?.message || 'Invalid OTP';
      setError(msg.includes('invalid-verification-code')
        ? 'Invalid OTP. Please try again.'
        : msg);
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
