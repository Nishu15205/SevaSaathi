"use client";

import { motion } from "framer-motion";
import { Star, Users, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";

const trustItems = [
  { icon: Star, value: "4.8", label: "Rating" },
  { icon: Users, value: "500+", label: "Verified Caregivers" },
  { icon: MapPin, value: "Delhi NCR", label: "Service Area" },
];

export default function HeroSection({ onOpenLogin }: { onOpenLogin: () => void }) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Full-width background image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-bg.png"
          alt="Home care background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left: Text content (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 text-sm font-medium text-lime-400 tracking-wide uppercase"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-lime-400" />
              Trusted Home Care in Delhi NCR
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.08] tracking-tight max-w-2xl"
            >
              Personalized home care solutions for{" "}
              <span className="text-lime-400">your loved ones</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-lg sm:text-xl text-white/80 max-w-xl leading-relaxed"
            >
              SevaSaathi connects you with verified nurses and caregivers for
              elderly care, patient support, and everyday home assistance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 mt-4"
            >
              <button onClick={onOpenLogin} className="btn-black inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
              <a href="#how-it-works" className="btn-outline-black border-white/60 text-white hover:bg-white hover:text-black inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base">
                Learn More
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </div>

          {/* Right: Floating trust badge (2 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
            className="lg:col-span-2 flex justify-center lg:justify-end"
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8 w-full max-w-xs">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-900">
                  <Star className="h-5 w-5 text-lime-400 fill-lime-400" />
                </div>
                <div>
                  <p className="font-bold text-forest-900 text-lg">SevaSaathi</p>
                  <p className="text-xs text-gray-500">Verified & Trusted</p>
                </div>
              </div>

              {/* Trust items */}
              <div className="flex flex-col gap-4">
                {trustItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.9 + i * 0.15,
                    }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-50 shrink-0">
                      <item.icon className="h-4 w-4 text-forest-900" />
                    </div>
                    <div>
                      <p className="font-bold text-forest-900 text-sm">
                        {item.value}
                      </p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Mini progress bar */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Caregiver Match Rate</span>
                  <span className="font-semibold text-forest-900">96%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "96%" }}
                    transition={{ duration: 1.2, delay: 1.4, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-forest-900 to-forest-700"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
