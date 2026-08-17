"use client";

import { useState, useRef, useEffect } from "react";
import { X, Eye, EyeOff, Loader2, Heart, User, Shield, KeyRound, ArrowLeft, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "login" | "register" | "reset" | "otp-verify";
type UserRole = "FAMILY" | "CAREGIVER";

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("FAMILY");

  // Reset form
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);

  // OTP verification
  const [otpEmail, setOtpEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpPurpose, setOtpPurpose] = useState<"REGISTER" | "RESET_PASSWORD">("REGISTER");
  const [demoOtp, setDemoOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [pendingRegisterData, setPendingRegisterData] = useState<any>(null);
  const otpInputRef = useRef<HTMLDivElement>(null);

  const clearMessages = () => { setError(""); setSuccess(""); setOtpError(""); };

  const resetAllForm = () => {
    clearMessages();
    setLoginEmail("");
    setLoginPassword("");
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    setResetEmail("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetDone(false);
    setOtpValue("");
    setOtpSent(false);
    setOtpVerified(false);
    setDemoOtp("");
    setOtpTimer(0);
    setPendingRegisterData(null);
  };

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      const fullUser = await api.auth.me(data.user.id);
      if (fullUser.user) useAuthStore.getState().setAuth(fullUser.user);
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (email: string, purpose: "REGISTER" | "RESET_PASSWORD") => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || "Failed to send OTP"); return; }
      setDemoOtp(data.otp);
      setOtpSent(true);
      setOtpTimer(120); // 2 minute cooldown for resend
    } catch {
      setOtpError("Failed to send OTP. Please try again.");
    } finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) { setOtpError("Please enter the 6-digit OTP"); return; }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, otp: otpValue, purpose: otpPurpose }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || "Invalid OTP"); return; }
      setOtpVerified(true);

      // After OTP verified, proceed with the original action
      if (otpPurpose === "REGISTER" && pendingRegisterData) {
        // Complete registration by logging in
        setLoading(true);
        try {
          const fullUser = await api.auth.me(pendingRegisterData.id);
          if (fullUser.user) useAuthStore.getState().setAuth(fullUser.user);
          setSuccess("Account verified! Welcome to SevaSaathi.");
          setTimeout(() => { onClose(); }, 800);
        } catch {
          setError("Account created but failed to load profile. Please login.");
          setTab("login");
        } finally { setLoading(false); }
      }
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally { setOtpLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      // Step 1: Create account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, password: regPassword, role: regRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }

      // Step 2: Send OTP for email verification
      setPendingRegisterData(data.user);
      setOtpEmail(regEmail);
      setOtpPurpose("REGISTER");
      setOtpValue("");
      setOtpSent(false);
      setOtpVerified(false);
      setOtpTimer(0);
      setTab("otp-verify");

      // Auto-send OTP when entering OTP tab
      await handleSendOtp(regEmail, "REGISTER");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const handleResetStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (resetNewPassword !== resetConfirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      // Step 1: Send OTP
      setOtpEmail(resetEmail);
      setOtpPurpose("RESET_PASSWORD");
      setOtpValue("");
      setOtpSent(false);
      setOtpVerified(false);
      setOtpTimer(0);
      setTab("otp-verify");

      await handleSendOtp(resetEmail, "RESET_PASSWORD");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const handleResetStep2 = async () => {
    if (!otpVerified) { setOtpError("Please verify your email first"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword: resetNewPassword, otpVerified: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); return; }
      setResetDone(true);
      setTab("reset");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const handleClose = () => {
    resetAllForm();
    setTab("login");
    onClose();
  };

  const goToReset = (email?: string) => {
    clearMessages();
    setResetDone(false);
    if (email) setResetEmail(email);
    setTab("reset");
  };

  const goToLogin = () => {
    clearMessages();
    setResetDone(false);
    setTab("login");
  };

  // Watch for OTP verification in reset flow
  useEffect(() => {
    if (otpVerified && otpPurpose === "RESET_PASSWORD") {
      // Will be handled by the user clicking "Reset Password" button
    }
  }, [otpVerified, otpPurpose]);

  const headerTitle = tab === "login"
    ? "Welcome back! Sign in to continue."
    : tab === "register"
    ? "Create your account to get started."
    : tab === "otp-verify"
    ? `Verify your email address`
    : "Reset your password";

  const headerSubtitle = tab === "otp-verify"
    ? `We've sent a 6-digit code to ${otpEmail}`
    : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Green header */}
            <div className="green-gradient-bg px-6 py-5 relative">
              <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <X className="h-4 w-4 text-white" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-5 w-5 text-white fill-white" />
                <span className="text-white font-bold text-lg">SevaSaathi</span>
              </div>
              <p className="text-white/80 text-sm">{headerTitle}</p>
              {headerSubtitle && (
                <p className="text-white/60 text-xs mt-1 truncate">{headerSubtitle}</p>
              )}
            </div>

            <div className="p-6">
              {/* Error / Success */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-2xl">{error}</motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-2xl">{success}</motion.div>
                )}
              </AnimatePresence>

              {/* ============ OTP VERIFICATION TAB ============ */}
              {tab === "otp-verify" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  <div className="text-center pt-2">
                    <div className="w-16 h-16 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-forest-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Enter Verification Code</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {otpPurpose === "REGISTER"
                        ? "Verify your email to complete registration"
                        : "Verify your email to reset password"}
                    </p>
                  </div>

                  {/* Demo OTP display */}
                  {demoOtp && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                      <p className="text-xs text-amber-600 font-medium mb-1">Demo OTP (would be sent to your email)</p>
                      <p className="text-2xl font-bold text-amber-700 tracking-[0.3em]">{demoOtp}</p>
                    </div>
                  )}

                  {/* OTP Input */}
                  <div ref={otpInputRef} className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpValue}
                      onChange={setOtpValue}
                      containerClassName="gap-2"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-12 w-12 rounded-xl border-2 border-gray-200 text-lg font-bold" />
                        <InputOTPSlot index={1} className="h-12 w-12 rounded-xl border-2 border-gray-200 text-lg font-bold" />
                        <InputOTPSlot index={2} className="h-12 w-12 rounded-xl border-2 border-gray-200 text-lg font-bold" />
                      </InputOTPGroup>
                      <InputOTPSeparator className="text-gray-300" />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="h-12 w-12 rounded-xl border-2 border-gray-200 text-lg font-bold" />
                        <InputOTPSlot index={4} className="h-12 w-12 rounded-xl border-2 border-gray-200 text-lg font-bold" />
                        <InputOTPSlot index={5} className="h-12 w-12 rounded-xl border-2 border-gray-200 text-lg font-bold" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {otpError && (
                    <p className="text-sm text-red-500 text-center">{otpError}</p>
                  )}

                  {otpVerified ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-green-700">Email verified successfully!</p>

                      {otpPurpose === "REGISTER" ? (
                        <div className="text-sm text-gray-500">Setting up your account...</div>
                      ) : (
                        <button
                          onClick={handleResetStep2}
                          disabled={loading}
                          className="btn-black w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</> : <><KeyRound className="h-4 w-4" /> Reset Password Now</>}
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <>
                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpLoading || otpValue.length !== 6}
                        className="btn-black w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {otpLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : <><ShieldCheck className="h-4 w-4" /> Verify OTP</>}
                      </button>

                      <div className="flex items-center justify-center gap-3 text-sm">
                        {otpTimer > 0 ? (
                          <span className="text-gray-400">Resend in <span className="font-medium text-forest-700">{Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, "0")}</span></span>
                        ) : (
                          <button
                            onClick={() => handleSendOtp(otpEmail, otpPurpose)}
                            disabled={otpLoading}
                            className="text-forest-800 font-medium hover:text-forest-600 disabled:opacity-50"
                          >
                            {otpLoading ? "Sending..." : "Resend OTP"}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (otpPurpose === "REGISTER") { setTab("register"); }
                          else { setTab("reset"); }
                        }}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-forest-800 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* ============ RESET PASSWORD TAB ============ */}
              {tab === "reset" && (
                <>
                  {resetDone ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
                      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Password Reset Successful!</h3>
                      <p className="text-sm text-gray-500 mb-6">You can now login with your new password.</p>
                      <button onClick={goToLogin} className="btn-black w-full py-3 text-sm">
                        Back to Login
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleResetStep1} className="space-y-4">
                      <button type="button" onClick={goToLogin} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-forest-800 transition-colors mb-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Login
                      </button>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Registered Email Address</label>
                        <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Enter your registered email" className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} required minLength={6} value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} placeholder="Min 6 characters" className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all pr-11" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                        <input type={showPassword ? "text" : "password"} required minLength={6} value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} placeholder="Re-enter new password" className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all" />
                      </div>

                      <button type="submit" disabled={loading} className="btn-black w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending OTP...</> : <><Mail className="h-4 w-4" />Send Verification OTP</>}
                      </button>

                      <p className="text-[11px] text-center text-gray-400">We'll send a verification code to your email to confirm your identity.</p>
                    </form>
                  )}
                </>
              )}

              {/* ============ LOGIN / REGISTER TABS ============ */}
              {tab !== "reset" && tab !== "otp-verify" && (
                <>
                  {/* Tab switcher */}
                  <div className="flex px-6 pt-5 gap-1 bg-gray-100 mx-6 mt-0 rounded-2xl">
                    <button onClick={() => { setTab("login"); resetAllForm(); }} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === "login" ? "bg-white text-forest-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                      Login
                    </button>
                    <button onClick={() => { setTab("register"); resetAllForm(); }} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === "register" ? "bg-white text-forest-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                      Register
                    </button>
                  </div>

                  {tab === "login" ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter your password" className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all pr-11" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Forgot Password link */}
                      <div className="flex justify-end">
                        <button type="button" onClick={() => goToReset(loginEmail)} className="text-xs text-forest-800 hover:text-forest-600 font-medium flex items-center gap-1 transition-colors">
                          <KeyRound className="h-3 w-3" /> Forgot Password?
                        </button>
                      </div>

                      <button type="submit" disabled={loading} className="btn-black w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : "Sign In"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                        <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your full name" className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                        <input type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} required minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min 6 characters" className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all pr-11" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setRegRole("FAMILY")} className={`flex-1 py-2.5 text-sm font-medium rounded-full border-2 transition-all ${regRole === "FAMILY" ? "border-forest-800 bg-forest-50 text-forest-800" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>Family Member</button>
                          <button type="button" onClick={() => setRegRole("CAREGIVER")} className={`flex-1 py-2.5 text-sm font-medium rounded-full border-2 transition-all ${regRole === "CAREGIVER" ? "border-forest-800 bg-forest-50 text-forest-800" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>Caregiver</button>
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="btn-black w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</> : "Create Account"}
                      </button>
                      <p className="text-[11px] text-center text-gray-400">You'll receive a verification OTP on your email after registration.</p>
                    </form>
                  )}

                  {/* Demo credentials */}
                  {tab === "login" && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-center text-gray-400 mb-3">Demo Accounts</p>
                      <div className="grid grid-cols-1 gap-2">
                        <button type="button" onClick={() => { setLoginEmail("anita.gupta@email.com"); setLoginPassword("password123"); }} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                          <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center shrink-0"><User className="h-4 w-4 text-forest-700" /></div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-700">Family Member</p>
                            <p className="text-[10px] text-gray-400 truncate">anita.gupta@email.com</p>
                          </div>
                        </button>
                        <button type="button" onClick={() => { setLoginEmail("sunita.care@email.com"); setLoginPassword("password123"); }} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                          <div className="w-8 h-8 rounded-lg bg-lime-50 flex items-center justify-center shrink-0"><Heart className="h-4 w-4 text-lime-700" /></div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-700">Caregiver</p>
                            <p className="text-[10px] text-gray-400 truncate">sunita.care@email.com</p>
                          </div>
                        </button>
                        <button type="button" onClick={() => { setLoginEmail("admin@sevasaathi.in"); setLoginPassword("password123"); }} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Shield className="h-4 w-4 text-amber-700" /></div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-700">Admin</p>
                            <p className="text-[10px] text-gray-400 truncate">admin@sevasaathi.in</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
