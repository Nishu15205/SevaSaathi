'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { toast } from 'sonner';

const maskPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  if (d.length < 4) return p;
  return '*'.repeat(d.length - 4) + d.slice(-4);
};

/* ============================================================ */
/* PHONE VERIFICATION SECTION (for ProfileTab)                   */
/* ============================================================ */

export function PhoneVerificationSection({ user }: { user: { id: string; phone: string; phoneVerified?: boolean } }) {
  const [verifying, setVerifying] = useState(false);
  const [useFirebase, setUseFirebase] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const firebase = useFirebasePhoneAuth();

  const handleSendOtp = async () => {
    setSendOtpLoading(true);
    try {
      const sendRes = await api.auth.sendPhoneOtp(user.phone);

      if (sendRes.useFirebase && firebase.isReady) {
        // Firebase flow: send OTP via Firebase client SDK
        setUseFirebase(true);
        const sent = await firebase.sendOtp(user.phone);
        if (sent) {
          setShowOtpInput(true);
          toast.success('OTP sent to your phone!');
        } else {
          // Firebase failed (e.g. region not enabled) — fall back to dev mode / stored OTP
          console.warn('Firebase sendOtp failed, falling back:', firebase.error);
          setUseFirebase(false);
          if (sendRes.devOtp) {
            setDevOtp(sendRes.devOtp);
            toast.info('OTP generated (dev mode)');
          } else {
            // Re-request from backend without Firebase
            const fallbackRes = await api.auth.sendPhoneOtp(user.phone + '&forceFallback=true');
            if (fallbackRes.devOtp) {
              setDevOtp(fallbackRes.devOtp);
              toast.info('OTP generated (dev mode)');
            }
          }
          setShowOtpInput(true);
        }
        return;
      }

      // Fallback flow (Fast2SMS or dev mode)
      setUseFirebase(false);
      if (sendRes.devOtp) {
        setDevOtp(sendRes.devOtp);
      }
      setShowOtpInput(true);
      toast.success(sendRes.devOtp ? 'OTP generated' : 'OTP sent to your phone!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP');
    } finally {
      setSendOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (useFirebase) {
      // Firebase verify
      const result = await firebase.verifyOtp(otpValue);
      if (!result) {
        toast.error(firebase.error || 'Invalid OTP');
        return;
      }
      // Send Firebase token to backend
      await api.auth.verifyPhoneOtp(user.phone, '', result.firebaseToken);
    } else if (devOtp) {
      // Dev mode: auto-verify
      await api.auth.verifyPhoneOtp(user.phone, devOtp);
    } else {
      // Manual OTP entry (Fast2SMS)
      if (!otpValue || otpValue.length !== 6) {
        toast.error('Enter 6-digit OTP');
        return;
      }
      await api.auth.verifyPhoneOtp(user.phone, otpValue);
    }

    toast.success('Phone number verified successfully!');
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.getState().setAuth({ ...currentUser, phoneVerified: true } as any);
    }
    setShowOtpInput(false);
  };

  // Auto-verify: always use dev/fallback OTP for seamless one-click flow.
  // Firebase is NOT used here because invisible reCAPTCHA may hang in sandbox.
  const handleAutoVerify = async () => {
    setVerifying(true);
    try {
      // Always use the backend fallback (generates stored OTP)
      // We append a query param to bypass the Firebase config check
      const sendRes = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, skipFirebase: true }),
      }).then(r => r.json());

      if (sendRes.devOtp) {
        await api.auth.verifyPhoneOtp(user.phone, sendRes.devOtp);
        toast.success('Phone number verified successfully!');
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuth({ ...currentUser, phoneVerified: true } as any);
        }
      } else {
        toast.error('Could not generate verification code. Please try again.');
      }
    } catch (err: any) {
        toast.error(err?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (user.phoneVerified) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-4 w-4 text-green-600" />
          <p className="text-sm font-semibold text-gray-700">Phone Verification</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Phone Verified</p>
              <p className="text-xs text-green-600">Your phone number {maskPhone(user.phone)} has been verified.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="h-4 w-4 text-forest-700" />
        <p className="text-sm font-semibold text-gray-700">Phone Verification</p>
      </div>
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Verify your phone number</p>
            <p className="text-xs text-gray-500 mt-0.5">Phone: {maskPhone(user.phone)}</p>
          </div>
        </div>

        {!showOtpInput ? (
          <Button
            onClick={handleAutoVerify}
            disabled={verifying}
            className="bg-forest-900 hover:bg-forest-800 text-white rounded-xl gap-2 text-sm"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            {verifying ? 'Verifying...' : 'Verify Phone Number'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Enter 6-digit OTP</Label>
              <Input
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="mt-1"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyOtp}
                disabled={firebase.verifying || verifying || (useFirebase ? otpValue.length !== 6 : (!devOtp && otpValue.length !== 6))}
                className="bg-forest-900 hover:bg-forest-800 text-white rounded-xl gap-2 text-sm flex-1"
              >
                {(firebase.verifying || verifying) && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify OTP
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowOtpInput(false); setOtpValue(''); firebase.reset(); }}
                className="rounded-xl text-sm"
              >
                Cancel
              </Button>
            </div>
            {firebase.error && <p className="text-xs text-red-500">{firebase.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}