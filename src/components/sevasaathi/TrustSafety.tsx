"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  ScanFace,
  FileCheck,
  Activity,
  LifeBuoy,
  Lock,
  CheckCircle2,
} from "lucide-react";

const trustPillars = [
  {
    icon: ScanFace,
    title: "ID Verification",
    description:
      "Aadhaar and government-issued IDs are verified before any caregiver profile goes live.",
  },
  {
    icon: ShieldCheck,
    title: "Background Checks",
    description:
      "Comprehensive criminal and address background checks conducted for every caregiver.",
  },
  {
    icon: FileCheck,
    title: "Skill Certification",
    description:
      "Medical and care qualifications are verified by our admin team — no fake credentials.",
  },
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description:
      "Track caregiver check-ins, care session activity, and daily report submissions live.",
  },
  {
    icon: LifeBuoy,
    title: "Emergency Support",
    description:
      "Medical emergencies are never treated as ordinary bookings — users are directed to proper emergency services.",
  },
  {
    icon: Lock,
    title: "Data Privacy",
    description:
      "Minimal data collection, secure storage, and strict access controls protect every user.",
  },
];

const stats = [
  { label: "Aadhaar Verified", value: "100%" },
  { label: "Background Checked", value: "100%" },
  { label: "Certified", value: "100%" },
];

export default function TrustSafety() {
  return (
    <section id="trust" className="py-20 lg:py-28 bg-[#f9fafb]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column — Heading, Description & Pillars */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold text-forest-600 tracking-wider uppercase mb-3">
              Trust & Safety
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-forest-900 mb-4">
              Your Family&apos;s Safety Is{" "}
              <span className="gradient-text">Non-Negotiable</span>
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed max-w-lg">
              Every decision at SevaSaathi is guided by one principle: families
              must feel confident about who is coming into their home and why
              they are the right fit.
            </p>

            <div className="space-y-5">
              {trustPillars.map((pillar, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="flex gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50">
                    <pillar.icon className="h-5 w-5 text-forest-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-forest-900 mb-0.5">
                      {pillar.title}
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column — Green Gradient Trust Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:sticky lg:top-28"
          >
            <div className="green-gradient-bg rounded-2xl p-8 sm:p-10 text-center">
              {/* Big Check Icon */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
                className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-lime-400/20 mb-6"
              >
                <CheckCircle2 className="h-10 w-10 text-lime-400" />
              </motion.div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Every caregiver is verified
              </h3>
              <p className="text-white/70 text-sm leading-relaxed mb-10 max-w-sm mx-auto">
                Before anyone steps into your home, they&apos;ve passed our
                multi-step verification process.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                  >
                    <p className="text-2xl sm:text-3xl font-bold text-lime-400 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-white/60 font-medium">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
