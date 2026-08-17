"use client";

import { useState } from "react";
import { X, Eye, EyeOff, Loader2, Heart, User, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "login" | "register";

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

  const resetForm = () => {
    setError("");
    setSuccess("");
    setLoginEmail("");
    setLoginPassword("");
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      const fullUser = await api.auth.me(data.user.id);
      if (fullUser.user) {
        useAuthStore.getState().setAuth(fullUser.user);
      }
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          role: regRole,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      const fullUser = await api.auth.me(data.user.id);
      if (fullUser.user) {
        useAuthStore.getState().setAuth(fullUser.user);
      }
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setTab("login");
    onClose();
  };

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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
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
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-5 w-5 text-white fill-white" />
                <span className="text-white font-bold text-lg">SevaSaathi</span>
              </div>
              <p className="text-white/80 text-sm">
                {tab === "login"
                  ? "Welcome back! Sign in to continue."
                  : "Create your account to get started."}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex px-6 pt-5 gap-1 bg-gray-100 mx-6 mt-0 rounded-2xl">
              <button
                onClick={() => { setTab("login"); resetForm(); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  tab === "login"
                    ? "bg-white text-forest-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => { setTab("register"); resetForm(); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  tab === "register"
                    ? "bg-white text-forest-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Register
              </button>
            </div>

            {/* Form content */}
            <div className="p-6">
              {/* Error / Success */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-2xl"
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-2xl"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {tab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-black w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      I am a
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole("FAMILY")}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-full border-2 transition-all ${
                          regRole === "FAMILY"
                            ? "border-forest-800 bg-forest-50 text-forest-800"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        Family Member
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole("CAREGIVER")}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-full border-2 transition-all ${
                          regRole === "CAREGIVER"
                            ? "border-forest-800 bg-forest-50 text-forest-800"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        Caregiver
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-black w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>
              )}

              {/* Demo credentials */}
              {tab === 'login' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-center text-gray-400 mb-3">Demo Accounts</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => { setLoginEmail('anita.gupta@email.com'); setLoginPassword('password123'); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-forest-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700">Family Member</p>
                        <p className="text-[10px] text-gray-400 truncate">anita.gupta@email.com</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginEmail('sunita.care@email.com'); setLoginPassword('password123'); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-lime-50 flex items-center justify-center shrink-0">
                        <Heart className="h-4 w-4 text-lime-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700">Caregiver</p>
                        <p className="text-[10px] text-gray-400 truncate">sunita.care@email.com</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginEmail('admin@sevasaathi.in'); setLoginPassword('password123'); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-amber-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700">Admin</p>
                        <p className="text-[10px] text-gray-400 truncate">admin@sevasaathi.in</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
              {tab === 'register' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-center text-gray-400">
                    Register a new {regRole === 'FAMILY' ? 'family' : 'caregiver'} account to get started.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
