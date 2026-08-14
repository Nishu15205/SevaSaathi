"use client";

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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
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
