"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Eye,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Scale,
  HeartHandshake,
} from "lucide-react";
import Image from "next/image";

const trustPillars = [
  {
    icon: ShieldCheck,
    title: "Meaningful Verification",
    description:
      "We never claim a person is medically qualified unless the relevant credential has actually been verified by our admin team. Every verification badge is earned.",
  },
  {
    icon: Lock,
    title: "Secure Document Storage",
    description:
      "Identity and verification documents are securely stored with restricted access and appropriate retention/deletion rules. Patient data is protected through strict access controls.",
  },
  {
    icon: Eye,
    title: "Minimal Data Collection",
    description:
      "We collect only the information needed for the service. No unnecessary data harvesting. Your privacy is respected at every step of the care journey.",
  },
  {
    icon: AlertTriangle,
    title: "Emergency Protocol",
    description:
      "Medical emergencies are never treated as ordinary caregiver bookings. Users are always directed to appropriate emergency medical services first.",
  },
  {
    icon: Scale,
    title: "Moderated Reviews",
    description:
      "All reviews and complaints go through moderation with structured escalation workflows. Fair and transparent resolution for every stakeholder.",
  },
  {
    icon: FileCheck,
    title: "Care Report Integrity",
    description:
      "Daily care reports distinguish routine care activities from medical diagnosis or treatment advice. Clear boundaries ensure accountability.",
  },
  {
    icon: RefreshCw,
    title: "Backup Caregiver Workflow",
    description:
      "A structured replacement and backup workflow ensures continuity of care. If your primary caregiver is unavailable, we have a plan.",
  },
];

export default function TrustSafety() {
  return (
    <section id="trust" className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Image + Quote */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/trust-illustration.png"
                alt="Verified caregiver with trust badge"
                width={1024}
                height={1024}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Quote card */}
            <div className="absolute -bottom-6 -right-4 sm:right-4 bg-white rounded-2xl shadow-xl p-5 border border-teal-100 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <HeartHandshake className="h-5 w-5 text-teal-600" />
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  Our Philosophy
                </p>
              </div>
              <p className="text-sm text-foreground font-medium leading-relaxed italic">
                &ldquo;Trust is the product. The most valuable feature is the
                confidence a family gets.&rdquo;
              </p>
            </div>
          </motion.div>

          {/* Right - Trust pillars */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-3">
              Trust & Safety
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Your Family&apos;s Safety
              <br />
              <span className="gradient-text">Is Non-Negotiable</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Every decision at SevaSaathi is guided by one principle: families
              must feel confident about who is coming, why they are suitable, and
              what happens during care.
            </p>

            <div className="space-y-4">
              {trustPillars.map((pillar, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="flex gap-3 p-3 rounded-xl hover:bg-teal-50/40 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 mt-0.5">
                    <pillar.icon className="h-4 w-4 text-teal-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{pillar.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
