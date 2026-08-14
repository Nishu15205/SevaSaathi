"use client";

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
import Roadmap from "@/components/sevasaathi/Roadmap";
import CTASection from "@/components/sevasaathi/CTASection";
import Footer from "@/components/sevasaathi/Footer";
import DashboardShell from "@/components/dashboard/DashboardShell";

function LandingPage({ onGoDashboard }: { onGoDashboard: () => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onGoDashboard={onGoDashboard} />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <Features />
        <SmartMatching />
        <ForUsers />
        <TrustSafety />
        <CompetitivePositioning />
        <Pricing />
        <Testimonials />
        <Roadmap />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Use a ref-based override so logout from dashboard goes to landing
  // even though isAuthenticated just became false
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
