"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  Heart,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Tab = "login" | "register";
type UserRole = "FAMILY" | "CAREGIVER";

/* ------------------------------------------------------------------ */
/*  Google SVG icon                                                    */
/* ------------------------------------------------------------------ */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className={className}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 30 } },
  exit: { opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.2 } },
};
const contentVariants = {
  enter: (tab: string) => ({ x: tab === "register" ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  exit: (tab: string) => ({ x: tab === "register" ? -40 : 40, opacity: 0, transition: { duration: 0.15 } }),
} as const;

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function LoginModal({ isOpen, onClose, defaultTab }: LoginModalProps) {
  /* ---- state ---- */
  const [tab, setTab] = useState<Tab>(defaultTab === "register" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

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
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);
  // 3-step reset flow
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'new-password'>('email');
  const [resetOtp, setResetOtp] = useState("");
  const [resetOtpSending, setResetOtpSending] = useState(false);
  const [resetVerifying, setResetVerifying] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(0);
  const [resetOtpVerified, setResetOtpVerified] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  // Google popup form
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleError, setGoogleError] = useState("");
  // googleSubmitting removed - redirect-based flow doesn't need it

  /* ---- OTP countdown timer ---- */
  useEffect(() => {
    if (resetCountdown <= 0) return;
    const timer = setTimeout(() => setResetCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetCountdown]);

  /* ---- reset form fields when switching tabs ---- */
  useEffect(() => { setError(""); setLoginPassword(""); }, [tab]);

  /* ---- reset entire state when modal closes ---- */
  const handleClose = useCallback(() => {
    setTab(defaultTab === "register" ? "register" : "login");
    setError(""); setShowPassword(false); setLoading(false);
    setLoginEmail(""); setLoginPassword("");
    setRegName(""); setRegEmail(""); setRegPhone(""); setRegPassword(""); setRegRole("FAMILY");
    setResetOpen(false); setResetEmail(""); setResetNewPassword("");
    setResetLoading(false); setResetError(""); setResetDone(false);
    setResetStep('email'); setResetOtp(""); setResetOtpSending(false);
    setResetVerifying(false); setResetCountdown(0); setResetOtpVerified(false);
    setResetToken("");
    setGoogleOpen(false); setGoogleEmail(""); setGoogleName(""); setGoogleError("");
    onClose();
  }, [onClose, defaultTab]);

  /* ================================================================ */
  /*  HANDLERS                                                         */
/* ================================================================ */

  const handleGoogleSignIn = async () => {
    setGoogleError("");
    try {
      const checkRes = await fetch("/api/auth/google-configured");
      const { configured } = await checkRes.json();
      if (configured) {
        const origin = window.location.origin;
        const role = tab === "register" ? regRole : "";
        window.location.href = `/api/auth/google-go?origin=${encodeURIComponent(origin)}&role=${encodeURIComponent(role)}`;
        return;
      }
    } catch { /* fall through */ }
    setGoogleOpen(true);
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim() || !googleName.trim()) { setGoogleError("Please enter your name and email."); return; }
    if (!googleEmail.trim().includes("@")) { setGoogleError("Please enter a valid email address."); return; }
    setGoogleError("");
    // Use redirect-based flow so cookies survive the proxy chain
    const origin = window.location.origin;
    const role = tab === "register" ? regRole : "";
    const params = new URLSearchParams({
      email: googleEmail.trim(),
      name: googleName.trim(),
      origin,
    });
    if (role) params.set("role", role);
    window.location.href = `/api/auth/google-simulate?${params.toString()}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      const result = await signIn("credentials", { email: loginEmail.trim(), password: loginPassword, redirect: false });
      if (result?.error) { setError("Invalid email or password. Please try again."); return; }
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData?.user) {
          const u = sessionData.user as any;
          setAuth({ id: u.id || "", email: u.email || "", name: u.name || "", phone: "", role: u.role || "FAMILY", avatarUrl: u.image || null, subscription: "NONE", patientProfiles: [], caregiverProfile: undefined });
        }
      } catch { /* AuthSync will pick it up */ }
      toast({ title: "Welcome back! \ud83c\udf89", description: "You have successfully logged in." });
      handleClose();
    } catch { setError("Something went wrong. Please try again."); } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) { setError("Please fill in all fields."); return; }
    if (regPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      await api.auth.register({ name: regName.trim(), email: regEmail.trim(), phone: regPhone.trim(), password: regPassword, role: regRole });
      const loginResult = await signIn("credentials", { email: regEmail.trim(), password: regPassword, redirect: false });
      if (loginResult?.error) {
        toast({ title: "Account created!", description: "Please log in with your credentials." });
        setTab("login"); setLoginEmail(regEmail.trim()); return;
      }
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData?.user) {
          const u = sessionData.user as any;
          setAuth({ id: u.id || "", email: u.email || "", name: u.name || "", phone: regPhone.trim(), role: u.role || regRole, avatarUrl: u.image || null, subscription: "NONE", patientProfiles: [], caregiverProfile: undefined });
        }
      } catch { /* AuthSync will pick it up */ }
      toast({ title: "Welcome to SevaSaathi! \ud83c\udf89", description: "Your account has been created." });
      handleClose();
    } catch (err: any) { setError(err?.message || "Registration failed. Please try again."); } finally { setLoading(false); }
  };

  const handleResetSendOtp = async () => {
    if (!resetEmail.trim() || !resetEmail.trim().includes("@")) { setResetError("Please enter a valid email address."); return; }
    setResetOtpSending(true); setResetError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), purpose: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.error || "Failed to send OTP."); return; }
      setResetStep("otp");
      setResetCountdown(60);
      toast({ title: "OTP Sent", description: "Check your email for the 6-digit code." });
    } catch { setResetError("Something went wrong. Please try again."); } finally { setResetOtpSending(false); }
  };

  const handleResetVerifyOtp = async () => {
    if (!resetOtp.trim() || resetOtp.trim().length !== 6) { setResetError("Please enter the 6-digit OTP."); return; }
    setResetVerifying(true); setResetError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), otp: resetOtp.trim(), purpose: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.error || "Invalid OTP. Please try again."); return; }
      setResetOtpVerified(true);
      setResetToken(data.resetToken || "");
      setResetStep("new-password");
    } catch { setResetError("Something went wrong. Please try again."); } finally { setResetVerifying(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetNewPassword.trim()) { setResetError("Please enter your new password."); return; }
    if (resetNewPassword.length < 6) { setResetError("Password must be at least 6 characters."); return; }
    if (!resetToken) { setResetError("Reset session expired. Please start over."); setResetStep('email'); return; }
    setResetLoading(true); setResetError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), newPassword: resetNewPassword, resetToken }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.error || "Failed to reset password."); return; }
      setResetDone(true);
      toast({ title: "Password reset successfully!", description: "You can now log in with your new password." });
    } catch { setResetError("Something went wrong. Please try again."); } finally { setResetLoading(false); }
  };

  /* ================================================================ */
  /*  RENDER                                                           */
/* ================================================================ */
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md p-0 overflow-hidden border-forest-200/40 max-h-[92vh] flex flex-col">
        <button onClick={handleClose} className="absolute top-3 right-3 z-50 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-2">
          <DialogHeader className="space-y-1 mb-1">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-9 h-9 rounded-xl bg-forest-900 flex items-center justify-center">
                <Heart className="w-5 h-5 text-lime-400" />
              </div>
              <DialogTitle className="text-xl font-bold text-forest-900">SevaSaathi</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              {tab === "login" ? "Sign in to your account" : "Create your account to get started"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mx-6 mt-1 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 pt-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setTab("login")} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${tab === "login" ? "bg-white text-forest-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Sign In</button>
            <button onClick={() => setTab("register")} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${tab === "register" ? "bg-white text-forest-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Create Account</button>
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
          <AnimatePresence mode="wait" custom={tab}>
            {tab === "login" && (
              <motion.div key="login" custom={tab} variants={contentVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
                <button type="button" onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 shadow-sm">
                  <GoogleIcon /> Continue with Google
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or continue with email</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10 h-11 border-gray-300" autoComplete="email" disabled={loading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</Label>
                      <button type="button" onClick={() => setResetOpen(true)} className="text-xs font-medium text-forest-700 hover:text-forest-900">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10 h-11 border-gray-300" autoComplete="current-password" disabled={loading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white font-semibold rounded-lg shadow-sm hover:shadow-md">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </form>
                <p className="text-center text-sm text-gray-500 pt-1">Don&apos;t have an account? <button onClick={() => setTab("register")} className="font-semibold text-forest-700 hover:text-forest-900">Create one</button></p>
              </motion.div>
            )}

            {tab === "register" && (
              <motion.div key="register" custom={tab} variants={contentVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
                {/* Role selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-800">How would you like to use SevaSaathi?</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <button type="button" onClick={() => setRegRole("FAMILY")} className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${regRole === "FAMILY" ? "border-forest-500 bg-forest-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${regRole === "FAMILY" ? "bg-forest-100" : "bg-gray-100"}`}>
                        <Heart className={`w-4.5 h-4.5 ${regRole === "FAMILY" ? "text-forest-700" : "text-gray-400"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${regRole === "FAMILY" ? "text-forest-900" : "text-gray-700"}`}>I need care for my family</p>
                        <p className={`text-xs mt-0.5 ${regRole === "FAMILY" ? "text-forest-600/80" : "text-gray-400"}`}>Find trusted caregivers for parents, elders, or family members at home</p>
                      </div>
                    </button>
                    <button type="button" onClick={() => setRegRole("CAREGIVER")} className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${regRole === "CAREGIVER" ? "border-forest-500 bg-forest-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${regRole === "CAREGIVER" ? "bg-forest-100" : "bg-gray-100"}`}>
                        <ShieldCheck className={`w-4.5 h-4.5 ${regRole === "CAREGIVER" ? "text-forest-700" : "text-gray-400"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${regRole === "CAREGIVER" ? "text-forest-900" : "text-gray-700"}`}>I want to provide care services</p>
                        <p className={`text-xs mt-0.5 ${regRole === "CAREGIVER" ? "text-forest-600/80" : "text-gray-400"}`}>Join as a caregiver, get bookings, and earn money</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button type="button" onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 shadow-sm">
                  <GoogleIcon /> Sign up with Google as {regRole === "CAREGIVER" ? "Caregiver" : "Family Member"}
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or register with email</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-sm font-medium text-gray-700">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="reg-name" type="text" placeholder="Your full name" value={regName} onChange={(e) => setRegName(e.target.value)} className="pl-10 h-11 border-gray-300" autoComplete="name" disabled={loading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="reg-email" type="email" placeholder="you@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="pl-10 h-11 border-gray-300" autoComplete="email" disabled={loading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="reg-phone" type="tel" placeholder="10-digit mobile number" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="pl-10 h-11 border-gray-300" autoComplete="tel" disabled={loading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="reg-password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="pl-10 pr-10 h-11 border-gray-300" autoComplete="new-password" disabled={loading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white font-semibold rounded-lg shadow-sm hover:shadow-md">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </form>
                <p className="text-center text-sm text-gray-500 pt-1">Already have an account? <button onClick={() => setTab("login")} className="font-semibold text-forest-700 hover:text-forest-900">Sign in</button></p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset Password View */}
        <AnimatePresence>
          {resetOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-forest-700" />
                    <h4 className="text-sm font-semibold text-gray-800">Reset Password</h4>
                  </div>
                  {/* Step indicators */
                  !resetDone && (
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resetStep === 'email' ? 'bg-forest-100 text-forest-800' : 'bg-gray-100 text-gray-400'}`}>1</span>
                      <span className="text-xs text-gray-300">/</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resetStep === 'otp' ? 'bg-forest-100 text-forest-800' : 'bg-gray-100 text-gray-400'}`}>2</span>
                      <span className="text-xs text-gray-300">/</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resetStep === 'new-password' ? 'bg-forest-100 text-forest-800' : 'bg-gray-100 text-gray-400'}`}>3</span>
                    </div>
                  )}
                </div>
                {resetDone ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" /> Password has been reset successfully!
                    </div>
                    <button
                      type="button"
                      onClick={() => { setResetOpen(false); setResetStep('email'); setResetOtpVerified(false); setResetDone(false); }}
                      className="w-full text-center text-sm font-semibold text-forest-700 hover:text-forest-900 py-1"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : resetStep === 'email' ? (
                  <div className="space-y-2.5">
                    {resetError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{resetError}</p>}
                    <p className="text-xs text-gray-500">Enter your email address to receive a verification code.</p>
                    <Input type="email" placeholder="Your email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="rounded-lg" />
                    <Button type="button" onClick={handleResetSendOtp} disabled={resetOtpSending} size="sm" className="w-full rounded-lg">
                      {resetOtpSending ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Sending...</> : <>Send OTP</>}
                    </Button>
                  </div>
                ) : resetStep === 'otp' ? (
                  <div className="space-y-2.5">
                    {resetError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{resetError}</p>}
                    <p className="text-xs text-gray-500">Enter the 6-digit code sent to <span className="font-medium text-gray-700">{resetEmail}</span></p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit OTP"
                      value={resetOtp}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 6) setResetOtp(v); }}
                      className="rounded-lg text-center text-lg tracking-widest font-mono"
                    />
                    <Button type="button" onClick={handleResetVerifyOtp} disabled={resetVerifying || resetOtp.length !== 6} size="sm" className="w-full rounded-lg">
                      {resetVerifying ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Verifying...</> : <>Verify OTP</>}
                    </Button>
                    <div className="text-center">
                      {resetCountdown > 0 ? (
                        <span className="text-xs text-gray-400">Resend in {resetCountdown}s</span>
                      ) : (
                        <button type="button" onClick={handleResetSendOtp} disabled={resetOtpSending} className="text-xs font-medium text-forest-700 hover:text-forest-900">
                          {resetOtpSending ? "Sending..." : "Resend OTP"}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-2.5">
                    {resetError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{resetError}</p>}
                    <p className="text-xs text-gray-500">OTP verified. Enter your new password below.</p>
                    <Input type="password" placeholder="New password (min 6 chars)" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} className="rounded-lg" required />
                    <Button type="submit" disabled={resetLoading} size="sm" className="w-full rounded-lg">
                      {resetLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Resetting...</> : <>Reset Password</>}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Simulate Dialog */}
        <AnimatePresence>
          {googleOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <GoogleIcon className="w-4 h-4" />
                  <h4 className="text-sm font-semibold text-gray-800">Google Sign-In (Simulated)</h4>
                </div>
                {googleError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg mb-2">{googleError}</p>}
                <form onSubmit={handleGoogleSubmit} className="space-y-2.5">
                  <Input type="text" placeholder="Full Name" value={googleName} onChange={(e) => setGoogleName(e.target.value)} className="rounded-lg" required />
                  <Input type="email" placeholder="Email" value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} className="rounded-lg" required />
                  <Button type="submit" size="sm" className="w-full rounded-lg">
                    Continue
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
