"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useHydrated } from "@/hooks/useHydrated";

import Navbar from "@/components/sevasaathi/Navbar";
import HeroSection from "@/components/sevasaathi/HeroSection";
import HowItWorks from "@/components/sevasaathi/HowItWorks";
import Features from "@/components/sevasaathi/Features";
import SmartMatching from "@/components/sevasaathi/SmartMatching";
import ForUsers from "@/components/sevasaathi/ForUsers";
import TrustSafety from "@/components/sevasaathi/TrustSafety";
import Pricing from "@/components/sevasaathi/Pricing";
import Testimonials from "@/components/sevasaathi/Testimonials";
import CompetitivePositioning from "@/components/sevasaathi/CompetitivePositioning";
import CTASection from "@/components/sevasaathi/CTASection";
import Footer from "@/components/sevasaathi/Footer";
import DashboardShell from "@/components/dashboard/DashboardShell";
import LoginModal from "@/components/sevasaathi/LoginModal";

function AuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const authStatus = searchParams.get("auth");
    const message = searchParams.get("message");

    if (authStatus === "success") {
      toast({
        title: "Welcome! 🎉",
        description: "Signed in with Google successfully.",
      });
      // Clean URL without re-render
      router.replace("/", { scroll: false });
    } else if (authStatus === "error") {
      toast({
        title: "Sign-in failed",
        description: message || "Google sign-in was cancelled or failed. Please try again.",
        variant: "destructive",
      });
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router, toast]);

  return null;
}

function LandingPage({ onGoDashboard }: { onGoDashboard: () => void }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<string | undefined>(undefined);

  const openLogin = (tab?: string) => {
    setLoginTab(tab);
    setLoginOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onGoDashboard={onGoDashboard} loginOpen={loginOpen} setLoginOpen={setLoginOpen} />
      <main className="flex-1">
        <HeroSection onOpenLogin={openLogin} />
        <HowItWorks />
        <Features onOpenLogin={openLogin} />
        <SmartMatching onOpenLogin={openLogin} />
        <ForUsers />
        <TrustSafety />
        <CompetitivePositioning />
        <Pricing onOpenLogin={openLogin} />
        <Testimonials />
        <CTASection onOpenLogin={openLogin} />
      </main>
      <Footer onOpenLogin={openLogin} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} defaultTab={loginTab} />
    </div>
  );
}

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hydrated = useHydrated();

  const showDashboard = hydrated && isAuthenticated && !!user;

  return (
    <>
      <Suspense><AuthCallbackHandler /></Suspense>
      <AnimatePresence mode="wait">
        {showDashboard ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-gray-50"
          >
            <DashboardShell onBack={clearAuth} />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage onGoDashboard={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
