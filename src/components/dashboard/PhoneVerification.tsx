'use client';

import { useState } from 'react';
import { Smartphone, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { toast } from 'sonner';

const maskPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  if (d.length < 4) return p;
  return '*'.repeat(d.length - 4) + d.slice(-4);
};

export function PhoneVerificationSection({ user }: { user: { id: string; phone: string; phoneVerified?: boolean } }) {
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const firebase = useFirebasePhoneAuth();

  // Phone number input (when user has no phone)
  const [newPhone, setNewPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const handleSavePhone = async () => {
    const clean = newPhone.replace(/\D/g, '');
    if (clean.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setSavingPhone(true);
    try {
      const res = await fetch('/api/auth/update-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, phone: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save phone');
        return;
      }
      // Update auth store with new phone
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth({ ...currentUser, phone: data.phone, phoneVerified: false } as any);
      }
      toast.success('Phone number saved!');
    } catch {
      toast.error('Failed to save phone number');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSendOtp = async () => {
    if (!firebase.isReady) {
      toast.error('Phone verification service is not available. Please contact support.');
      return;
    }

    setSendOtpLoading(true);
    try {
      const sent = await firebase.sendOtp(user.phone);
      if (sent) {
        setShowOtpInput(true);
        toast.success('OTP sent to your phone!');
      } else {
        toast.error(firebase.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP');
    } finally {
      setSendOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toast.error('Enter the 6-digit OTP sent to your phone');
      return;
    }

    setVerifying(true);
    try {
      const result = await firebase.verifyOtp(otpValue);
      if (!result) {
        toast.error(firebase.error || 'Invalid OTP. Please try again.');
        return;
      }

      const res = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, firebaseToken: result.firebaseToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Verification failed');
        return;
      }

      toast.success('Phone number verified successfully!');
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth({ ...currentUser, phoneVerified: true } as any);
      }
      setShowOtpInput(false);
      setOtpValue('');
      firebase.reset();
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setOtpValue('');
    firebase.reset();
    setShowOtpInput(false);
    setTimeout(() => handleSendOtp(), 300);
  };

  // Verified state
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

  // No phone number — show phone input first
  if (!user.phone) {
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
              <p className="text-sm font-semibold text-gray-800">Add your phone number</p>
              <p className="text-xs text-gray-500 mt-0.5">Required to receive booking requests and verify your identity</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">Phone Number</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex items-center px-3 bg-gray-100 rounded-xl border border-gray-200 text-sm text-gray-500">
                  +91
                </div>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="flex-1"
                />
              </div>
            </div>
            <Button
              onClick={handleSavePhone}
              disabled={savingPhone || newPhone.replace(/\D/g, '').length !== 10}
              className="bg-forest-900 hover:bg-forest-800 text-white rounded-xl gap-2 text-sm w-full"
            >
              {savingPhone && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingPhone ? 'Saving...' : 'Save Phone Number'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Has phone but not verified — show OTP flow
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
            onClick={handleSendOtp}
            disabled={sendOtpLoading || !firebase.isReady}
            className="bg-forest-900 hover:bg-forest-800 text-white rounded-xl gap-2 text-sm"
          >
            {sendOtpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            {sendOtpLoading ? 'Sending OTP...' : !firebase.isReady ? 'Verification Unavailable' : 'Send OTP to Phone'}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Enter the 6-digit OTP sent to {maskPhone(user.phone)}</p>
            <div>
              <Label className="text-xs text-gray-500">OTP</Label>
              <Input
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="mt-1"
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyOtp}
                disabled={firebase.verifying || verifying || otpValue.length !== 6}
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
            <button
              type="button"
              onClick={handleResend}
              disabled={firebase.sendingOtp}
              className="text-xs text-forest-700 hover:text-forest-900 font-medium disabled:opacity-50"
            >
              {firebase.sendingOtp ? 'Resending...' : 'Resend OTP'}
            </button>
            {firebase.error && <p className="text-xs text-red-500">{firebase.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
