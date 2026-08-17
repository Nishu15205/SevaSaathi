"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { AnimatePresence, motion } from "framer-motion";

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
        <Features />
        <SmartMatching onOpenLogin={openLogin} />
        <ForUsers />
        <TrustSafety />
        <CompetitivePositioning />
        <Pricing onOpenLogin={openLogin} />
        <Testimonials />
        <CTASection onOpenLogin={openLogin} />
      </main>
      <Footer onOpenLogin={openLogin} />
      <AnimatePresence>
        {loginOpen && (
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} defaultTab={loginTab} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const showDashboard = isAuthenticated && !!user;

  return (
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
  );
}
