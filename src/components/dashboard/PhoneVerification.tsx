'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, ShieldCheck, Info, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

/* ============================================================ */
/* SHARED OTP DIALOG                                             */
/* ============================================================ */

function OtpDialog({
  phone,
  open,
  onOpenChange,
  onVerified,
}: {
  phone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}) {
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [smsConfigured, setSmsConfigured] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendOtp = useCallback(async () => {
    setOtpSending(true);
    setOtpError('');
    try {
      const res = await api.auth.sendPhoneOtp(phone);
      setCountdown(60);
      if (res.devOtp) {
        toast.info('Test OTP: ' + res.devOtp + ' (SMS not configured)');
      } else {
        toast.success('OTP sent to ' + phone);
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  }, [phone]);

  // Check if SMS is configured
  useEffect(() => {
    fetch('/api/auth/sms-configured')
      .then((r) => r.json())
      .then((data: { configured: boolean }) => setSmsConfigured(data.configured))
      .catch(() => { /* default to false */ });
  }, []);

  // Auto-send OTP when dialog opens
  useEffect(() => {
    if (open) {
      setOtp('');
      setOtpError('');
      setCountdown(0);
      sendOtp();
    }
  }, [open, sendOtp]);

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }
    setVerifying(true);
    setOtpError('');
    try {
      await api.auth.verifyPhoneOtp(phone, otp);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth({ ...currentUser, phoneVerified: true });
      }
      toast.success('Phone number verified successfully!');
      onVerified();
      onOpenChange(false);
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Smartphone className="h-4.5 w-4.5 text-amber-600" />
            </div>
            Verify Phone Number
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            We&apos;ve sent a 6-digit OTP to <span className="font-medium text-gray-700">{phone}</span>. Enter it below to verify your number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {otpSending && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending OTP...
            </div>
          )}

          {otpError && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {otpError}
            </div>
          )}

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => { setOtp(value); setOtpError(''); }}
              disabled={verifying || otpSending}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-12 w-12 text-base font-bold border-amber-300 focus:border-amber-500 rounded-lg" />
                <InputOTPSlot index={1} className="h-12 w-12 text-base font-bold border-amber-300 focus:border-amber-500 rounded-lg" />
                <InputOTPSlot index={2} className="h-12 w-12 text-base font-bold border-amber-300 focus:border-amber-500 rounded-lg" />
              </InputOTPGroup>
              <InputOTPSeparator className="text-amber-400" />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="h-12 w-12 text-base font-bold border-amber-300 focus:border-amber-500 rounded-lg" />
                <InputOTPSlot index={4} className="h-12 w-12 text-base font-bold border-amber-300 focus:border-amber-500 rounded-lg" />
                <InputOTPSlot index={5} className="h-12 w-12 text-base font-bold border-amber-300 focus:border-amber-500 rounded-lg" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              {countdown > 0 ? (
                <p className="text-xs text-gray-500">Resend in {countdown}s</p>
              ) : (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={otpSending}
                  className="text-xs font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50 transition-colors"
                >
                  {otpSending ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>
            <Button
              onClick={handleVerify}
              disabled={otp.length !== 6 || verifying || otpSending}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verify OTP
            </Button>
          </div>

          {smsConfigured ? (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-green-50">
              <Info className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-green-700 leading-relaxed">A 6-digit OTP has been sent to your phone via SMS. Please check your messages.</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50">
              <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-700 leading-relaxed">OTP is shown in the toast notification for testing. Configure SMS credentials in Admin settings for real delivery.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================ */
/* PHONE VERIFICATION BANNER (for OverviewTab)                   */
/* ============================================================ */

export function PhoneVerificationBanner({ user }: { user: { id: string; phone: string; phoneVerified?: boolean } }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-2xl border-amber-200 bg-amber-50/80 overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-900">Verify Your Phone Number</p>
                  <p className="text-xs text-amber-700/80 mt-0.5">
                    Phone verification is required for caregivers to receive bookings. Your number: {user.phone}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setDialogOpen(true)}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shrink-0 gap-1.5"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Verify Phone Number
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <OtpDialog
        phone={user.phone}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onVerified={() => { /* banner hides via phoneVerified check in parent */ }}
      />
    </>
  );
}

/* ============================================================ */
/* PHONE VERIFICATION SECTION (for ProfileTab)                   */
/* ============================================================ */

export function PhoneVerificationSection({ user }: { user: { id: string; phone: string; phoneVerified?: boolean } }) {
  const [dialogOpen, setDialogOpen] = useState(false);

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
              <p className="text-xs text-green-600">Your phone number {user.phone} has been verified.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
              <p className="text-xs text-gray-500 mt-0.5">Phone: {user.phone}</p>
            </div>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-forest-900 hover:bg-forest-800 text-white rounded-xl gap-2 text-sm"
          >
            <Smartphone className="h-4 w-4" />
            Verify Phone Number
          </Button>
        </div>
      </div>

      <OtpDialog
        phone={user.phone}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onVerified={() => { /* section updates via phoneVerified check */ }}
      />
    </>
  );
}
