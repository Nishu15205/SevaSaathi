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
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      className={className}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const contentVariants = {
  enter: (tab: string) => ({
    x: tab === "register" ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
  exit: (tab: string) => ({
    x: tab === "register" ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.15 },
  }),
};

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function LoginModal({ isOpen, onClose, defaultTab }: LoginModalProps) {
  /* ---- state ---- */
  const [tab, setTab] = useState<Tab>(defaultTab === "register" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // Reset form (simplified — no OTP)
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  // Google popup form
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  /* ---- reset form fields when switching tabs ---- */
  useEffect(() => {
    setError("");
    setLoginPassword("");
  }, [tab]);

  /* ---- reset entire state when modal closes ---- */
  const handleClose = useCallback(() => {
    setTab(defaultTab === "register" ? "register" : "login");
    setError("");
    setShowPassword(false);
    setLoading(false);
    setGoogleLoading(false);
    setLoginEmail("");
    setLoginPassword("");
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    setRegRole("FAMILY");
    setResetOpen(false);
    setResetEmail("");
    setResetNewPassword("");
    setResetLoading(false);
    setResetError("");
    setResetDone(false);
    setGoogleOpen(false);
    setGoogleEmail("");
    setGoogleName("");
    setGoogleError("");
    setGoogleSubmitting(false);
    onClose();
  }, [onClose, defaultTab]);

  /* ================================================================ */
  /*  HANDLERS                                                         */
  /* ================================================================ */

  /* ---- Google sign-in — opens simulated Google popup ---- */
  const handleGoogleSignIn = () => {
    setGoogleOpen(true);
    setGoogleError("");
  };

  /* ---- Google popup submit ---- */
  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim() || !googleName.trim()) {
      setGoogleError("Please enter your name and email.");
      return;
    }
    if (!googleEmail.trim().includes("@")) {
      setGoogleError("Please enter a valid email address.");
      return;
    }
    setGoogleSubmitting(true);
    setGoogleError("");
    try {
      // 1. Call the simulate endpoint (sets the session cookie)
      const res = await fetch("/api/auth/google-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmail.trim(), name: googleName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGoogleError(data.error || "Google sign-in failed.");
        return;
      }

      // 2. Fetch the NextAuth session (cookie is already set by step 1)
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      if (sessionData?.user) {
        // 3. Directly update the Zustand store — no page reload needed
        setAuth({
          id: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.name,
          phone: "",
          role: sessionData.user.role,
          avatarUrl: sessionData.user.image || null,
          subscription: "NONE" as any,
          patientProfiles: [],
          caregiverProfile: null,
        });
        setGoogleOpen(false);
        toast({
          title: "Welcome" + (data.user.isNewUser ? " to SevaSaathi!" : " back!") + " \ud83c\udf89",
          description: "Signed in as " + data.user.email,
        });
        handleClose();
      } else {
        // Fallback: reload the page so NextAuth picks up the cookie
        window.location.href = window.location.origin;
      }
    } catch {
      setGoogleError("Something went wrong. Please try again.");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  /* ---- Email / password login ---- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim(),
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      // AuthSync in AuthProvider will automatically sync session → Zustand store
      toast({
        title: "Welcome back! 🎉",
        description: "You have successfully logged in.",
      });
      handleClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Registration ---- */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1. Register
      const regRes = await api.auth.register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        role: regRole,
      });

      // 2. Auto-login with credentials
      const loginResult = await signIn("credentials", {
        email: regEmail.trim(),
        password: regPassword,
        redirect: false,
      });

      if (loginResult?.error) {
        // Registration succeeded but auto-login failed — that's ok, just notify
        toast({ title: "Account created!", description: "Please log in with your credentials." });
        setTab("login");
        setLoginEmail(regEmail.trim());
        return;
      }

      toast({ title: "Welcome to SevaSaathi! 🎉", description: "Your account has been created." });
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Reset password (simplified) ---- */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetNewPassword.trim()) {
      setResetError("Please enter your email and new password.");
      return;
    }
    if (resetNewPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), newPassword: resetNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Failed to reset password.");
        return;
      }
      setResetDone(true);
      toast({ title: "Password reset successfully!", description: "You can now log in with your new password." });
    } catch {
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-forest-200/40">
        {/* Custom X button to override default position */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-50 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-2">
          <DialogHeader className="space-y-1 mb-1">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-9 h-9 rounded-xl bg-forest-900 flex items-center justify-center">
                <Heart className="w-5 h-5 text-lime-400" />
              </div>
              <DialogTitle className="text-xl font-bold text-forest-900">
                SevaSaathi
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              {tab === "login"
                ? "Sign in to your account"
                : "Create your account to get started"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ---- Error banner ---- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-6 mt-1 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Tab switcher ---- */}
        <div className="px-6 pt-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                tab === "login"
                  ? "bg-white text-forest-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                tab === "register"
                  ? "bg-white text-forest-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* ---- Animated content ---- */}
        <div className="px-6 py-4 overflow-hidden">
          <AnimatePresence mode="wait" custom={tab}>
            {/* ========== LOGIN TAB ========== */}
            {tab === "login" && (
              <motion.div
                key="login"
                custom={tab}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                {/* Google button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 text-sm font-medium text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    or continue with email
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Email / password form */}
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-11 border-gray-300 focus:border-forest-500 focus:ring-forest-500"
                        autoComplete="email"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => setResetOpen(true)}
                        className="text-xs font-medium text-forest-700 hover:text-forest-900 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 border-gray-300 focus:border-forest-500 focus:ring-forest-500"
                        autoComplete="current-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Switch to register */}
                <p className="text-center text-sm text-gray-500 pt-1">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => setTab("register")}
                    className="font-semibold text-forest-700 hover:text-forest-900 transition-colors"
                  >
                    Create one
                  </button>
                </p>
              </motion.div>
            )}

            {/* ========== REGISTER TAB ========== */}
            {tab === "register" && (
              <motion.div
                key="register"
                custom={tab}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                {/* Google button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 text-sm font-medium text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Sign up with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    or register with email
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Registration form */}
                <form onSubmit={handleRegister} className="space-y-3">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Your full name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="pl-10 h-11 border-gray-300 focus:border-forest-500 focus:ring-forest-500"
                        autoComplete="name"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-10 h-11 border-gray-300 focus:border-forest-500 focus:ring-forest-500"
                        autoComplete="email"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="reg-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="pl-10 h-11 border-gray-300 focus:border-forest-500 focus:ring-forest-500"
                        autoComplete="tel"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Role selector */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                      I am a
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole("FAMILY")}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-150 ${
                          regRole === "FAMILY"
                            ? "border-forest-500 bg-forest-50 text-forest-900"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${regRole === "FAMILY" ? "text-forest-600" : "text-gray-400"}`} />
                        Family
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole("CAREGIVER")}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-150 ${
                          regRole === "CAREGIVER"
                            ? "border-forest-500 bg-forest-50 text-forest-900"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <ShieldCheck className={`w-4 h-4 ${regRole === "CAREGIVER" ? "text-forest-600" : "text-gray-400"}`} />
                        Caregiver
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 border-gray-300 focus:border-forest-500 focus:ring-forest-500"
                        autoComplete="new-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Switch to login */}
                <p className="text-center text-sm text-gray-500 pt-1">
                  Already have an account?{" "}
                  <button
                    onClick={() => setTab("login")}
                    className="font-semibold text-forest-700 hover:text-forest-900 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---- Footer ---- */}
        <div className="px-6 pb-5">
          <p className="text-center text-[11px] text-gray-400 leading-relaxed">
            By continuing, you agree to SevaSaathi&apos;s{" "}
            <span className="underline cursor-pointer hover:text-gray-600">Terms of Service</span>
            {" "}and{" "}
            <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>
          </p>
        </div>
      </DialogContent>

      {/* ============================================================ */}
      {/*  FORGOT PASSWORD DIALOG                                      */}
      {/* ============================================================ */}
      <Dialog open={resetOpen} onOpenChange={(open) => !open && setResetOpen(false)}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-forest-200/40">
          <div className="px-6 pt-6 pb-2">
            <DialogHeader>
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-forest-700" />
                </div>
              </div>
              <DialogTitle className="text-lg font-bold text-forest-900 text-center">
                Reset Password
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 text-center">
                Enter your email and a new password to reset your account.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Error */}
          <AnimatePresence>
            {resetError && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mx-6 mt-1 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <X className="w-4 h-4 flex-shrink-0" />
                  {resetError}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success state */}
          {resetDone ? (
            <div className="px-6 py-8 text-center space-y-3">
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-sm text-gray-700 font-medium">
                Password reset successfully!
              </p>
              <p className="text-xs text-gray-500">
                You can now sign in with your new password.
              </p>
              <Button
                onClick={() => {
                  setResetOpen(false);
                  setResetDone(false);
                }}
                className="mt-2 bg-forest-900 hover:bg-forest-800 text-white font-medium rounded-lg"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <div className="px-6 py-4">
              <form onSubmit={handleReset} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10 h-11 border-gray-300 focus:border-forest-500 focus:ring-forest-500"
                      autoComplete="email"
                      disabled={resetLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reset-password" className="text-sm font-medium text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 border-gray-300 focus:border-forest-500 focus:ring-forest-500"
                      autoComplete="new-password"
                      disabled={resetLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-11 bg-forest-900 hover:bg-forest-800 text-white font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/*  GOOGLE SIGN-IN POPUP                                        */}
      {/* ============================================================ */}
      <Dialog open={googleOpen} onOpenChange={(open) => !open && setGoogleOpen(false)}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <DialogHeader>
              <div className="flex items-center justify-center mb-3">
                <GoogleIcon className="w-10 h-10" />
              </div>
              <DialogTitle className="text-lg font-normal text-gray-800 text-center">
                Sign in with Google
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 text-center mt-1">
                Enter your Google account details to continue
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Error */}
          <AnimatePresence>
            {googleError && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mx-6 mt-1 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <X className="w-4 h-4 flex-shrink-0" />
                  {googleError}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-6 py-4">
            <form onSubmit={handleGoogleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="google-name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="google-name"
                    type="text"
                    placeholder="Your name"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="pl-10 h-11 border-gray-300"
                    autoComplete="name"
                    disabled={googleSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="google-email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="google-email"
                    type="email"
                    placeholder="you@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="pl-10 h-11 border-gray-300"
                    autoComplete="email"
                    disabled={googleSubmitting}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={googleSubmitting}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md"
              >
                {googleSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4 mr-2" />
                    Continue with Google
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="px-6 pb-4">
            <p className="text-center text-[11px] text-gray-400 leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
