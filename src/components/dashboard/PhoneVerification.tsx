'use client';

import { useState } from 'react';
import { Smartphone, ShieldCheck, Loader2, Globe, ChevronDown, AlertTriangle, RefreshCw, KeyRound, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const COUNTRIES = [
  { code: '+91', label: 'India', flag: '🇮🇳' },
  { code: '+1', label: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', label: 'UK', flag: '🇬🇧' },
  { code: '+971', label: 'UAE', flag: '🇦🇪' },
  { code: '+966', label: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+65', label: 'Singapore', flag: '🇸🇬' },
  { code: '+61', label: 'Australia', flag: '🇦🇺' },
  { code: '+49', label: 'Germany', flag: '🇩🇪' },
  { code: '+974', label: 'Qatar', flag: '🇶🇦' },
  { code: '+968', label: 'Oman', flag: '🇴🇲' },
  { code: '+60', label: 'Malaysia', flag: '🇲🇾' },
];

const maskPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  if (d.length < 4) return p;
  return '*'.repeat(d.length - 4) + d.slice(-4);
};

export function PhoneVerificationSection({ user }: { user: { id: string; phone: string; phoneVerified?: boolean; email?: string } }) {
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [smsDelivered, setSmsDelivered] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Phone number input (when user has no phone)
  const [newPhone, setNewPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const handleSavePhone = async () => {
    const clean = newPhone.replace(/\D/g, '');
    if (clean.length < 7) {
      toast.error('Enter a valid phone number');
      return;
    }
    setSavingPhone(true);
    try {
      const fullPhone = selectedCountry.code + clean;
      const res = await fetch('/api/auth/update-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to save phone'); return; }
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth({ ...currentUser, phone: data.phone, phoneVerified: false } as any);
      }
      toast.success('Phone number saved!');
    } catch { toast.error('Failed to save phone number'); } finally { setSavingPhone(false); }
  };

  const handleSendOtp = async () => {
    setSendOtpLoading(true);
    setError(null);
    setOtpValue('');
    setDevOtp(null);
    setOtpSent(false);

    try {
      const res = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, userId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || 'Please wait before requesting another OTP');
        } else {
          setError(data.error || 'Failed to send OTP');
        }
        return;
      }

      setOtpSent(true);
      setSmsDelivered(data.via === 'sms');
      
      // Always get the OTP for fallback display
      if (data.otp) {
        setDevOtp(data.otp);
      }
      
      setShowOtpInput(true);

      if (data.via === 'sms') {
        toast.success('OTP sent to your phone via SMS!');
      } else {
        toast.info('MSG91 not configured — using dev mode');
      }
    } catch (e: any) {
      console.error('Phone OTP send error:', e);
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSendOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Verification failed'); return; }
      toast.success('Phone number verified successfully!');
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth({ ...currentUser, phoneVerified: true } as any);
      }
      setShowOtpInput(false);
      setOtpValue('');
      setOtpSent(false);
      setDevOtp(null);
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setOtpValue('');
    setOtpSent(false);
    setDevOtp(null);
    setError(null);
    setShowOtpInput(false);
    setTimeout(() => handleSendOtp(), 300);
  };

  const handleCancel = () => {
    setShowOtpInput(false);
    setOtpValue('');
    setOtpSent(false);
    setDevOtp(null);
    setError(null);
  };

  // ✅ Verified state
  if (user.phoneVerified) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-4 w-4 text-green-600" />
          <p className="text-sm font-semibold text-gray-700">Phone Verification</p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-white" />
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

  // 📱 No phone number — add phone first
  if (!user.phone) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-4 w-4 text-forest-700" />
          <p className="text-sm font-semibold text-gray-700">Phone Verification</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 space-y-4 border border-amber-200/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone className="h-5 w-5 text-white" />
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
                <div className="relative">
                  <button type="button" onClick={() => setShowCountryDropdown(!showCountryDropdown)} className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-[100px]">
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                    <ChevronDown className="h-3 w-3 ml-auto" />
                  </button>
                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 font-medium">
                          <Globe className="h-3 w-3" /> Select Country
                        </div>
                        {COUNTRIES.map((c) => (
                          <button key={c.code + c.label} type="button" onClick={() => { setSelectedCountry(c); setShowCountryDropdown(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${selectedCountry.code === c.code ? 'bg-forest-50 text-forest-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                            <span className="text-base">{c.flag}</span>
                            <span className="flex-1 text-left">{c.label}</span>
                            <span className="text-xs text-gray-400">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 15))} placeholder="Phone number" className="flex-1 rounded-xl" />
              </div>
            </div>
            <Button onClick={handleSavePhone} disabled={savingPhone || newPhone.replace(/\D/g, '').length < 7} className="bg-gradient-to-r from-forest-700 to-forest-900 hover:from-forest-800 hover:to-forest-950 text-white rounded-xl gap-2 text-sm w-full shadow-sm">
              {savingPhone && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingPhone ? 'Saving...' : 'Save Phone Number'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ⏳ Has phone but not verified — Send OTP
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="h-4 w-4 text-forest-700" />
        <p className="text-sm font-semibold text-gray-700">Phone Verification</p>
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 space-y-4 border border-amber-200/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Verify your phone number</p>
            <p className="text-xs text-gray-500 mt-0.5">Phone: {maskPhone(user.phone)}</p>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* OTP Input Section */}
        {showOtpInput && !error ? (
          <div className="space-y-3">
            {/* Status message */}
            {otpSent && (
              <div className={`flex items-center gap-2 rounded-xl p-3 border ${smsDelivered ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${smsDelivered ? 'bg-green-500' : 'bg-amber-500'}`}>
                  <span className="text-white text-xs font-bold">{smsDelivered ? '✓' : '!'}</span>
                </div>
                <p className={`text-xs font-medium ${smsDelivered ? 'text-green-700' : 'text-amber-800'}`}>
                  {smsDelivered
                    ? `OTP sent to ${maskPhone(user.phone)} — check your SMS`
                    : 'MSG91 not configured — admin needs to set up SMS credentials'}
                </p>
              </div>
            )}

            {/* Dev/Fallback OTP display */}
            {devOtp && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <KeyRound className="h-4 w-4 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 font-medium">
                  {smsDelivered
                    ? 'SMS nahi aaya? Ye OTP use karo: '
                    : 'Your OTP: '}
                  <span className="font-mono font-bold tracking-widest text-blue-900">{devOtp}</span>
                </p>
              </div>
            )}

            {/* OTP Input — always 6 digits */}
            <div>
              <Label className="text-xs text-gray-500">Enter 6-digit OTP</Label>
              <Input
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="mt-1 rounded-xl text-center text-lg tracking-[0.5em] font-mono"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleVerifyOtp}
                disabled={verifying || otpValue.length < 6}
                className="bg-gradient-to-r from-forest-700 to-forest-900 hover:from-forest-800 hover:to-forest-950 text-white rounded-xl gap-2 text-sm flex-1 shadow-sm"
              >
                {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                {verifying ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="rounded-xl text-sm"
              >
                Cancel
              </Button>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={sendOtpLoading}
              className="text-xs text-forest-700 hover:text-forest-900 font-medium disabled:opacity-50 flex items-center gap-1"
            >
              {sendOtpLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Resend OTP
            </button>
          </div>
        ) : !error ? (
          <Button
            onClick={handleSendOtp}
            disabled={sendOtpLoading}
            className="bg-gradient-to-r from-forest-700 to-forest-900 hover:from-forest-800 hover:to-forest-950 text-white rounded-xl gap-2 text-sm shadow-sm"
          >
            {sendOtpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            {sendOtpLoading ? 'Sending OTP...' : 'Send OTP via SMS'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
