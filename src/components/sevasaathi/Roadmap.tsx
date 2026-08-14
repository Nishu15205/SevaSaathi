"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

const phases = [
  {
    number: 1,
    title: "Phase 1 — MVP",
    subtitle: "Core Platform",
    items: [
      "Profile creation for families & caregivers",
      "Search & smart matching engine",
      "Booking & scheduling system",
      "Reviews & ratings",
    ],
  },
  {
    number: 2,
    title: "Phase 2 — Growth",
    subtitle: "Enhanced Experience",
    items: [
      "Real-time caregiver tracking",
      "Care reports & documentation",
      "Integrated payments",
      "Smart alerts & notifications",
    ],
  },
  {
    number: 3,
    title: "Phase 3 — Scale",
    subtitle: "Nationwide Expansion",
    items: [
      "AI-powered matching algorithms",
      "Wearable health integration",
      "Multi-city operations",
      "Enterprise & B2B partnerships",
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function Roadmap() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16 lg:mb-20"
        >
          <p className="text-sm font-semibold text-forest-600 tracking-wider uppercase mb-3">
            Development Roadmap
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Our Journey
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            From a lean MVP to a nationwide care platform — here&apos;s how we&apos;re
            building SevaSaathi step by step.
          </p>
        </motion.div>

        {/* Timeline - Vertical on mobile, Horizontal on md+ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="relative"
        >
          {/* Mobile: Vertical Layout */}
          <div className="md:hidden relative flex flex-col gap-0">
            {/* Vertical connector line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-forest-200 z-0" />

            {phases.map((phase) => (
              <motion.div
                key={phase.number}
                variants={itemVariants}
                className="relative pl-16 pb-10 last:pb-0"
              >
                {/* Numbered circle on the line */}
                <div className="absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-forest-900 text-white font-bold text-lg shadow-md">
                  {phase.number}
                </div>

                {/* Content card */}
                <div className="bg-secondary/60 rounded-2xl p-5 border border-border/40">
                  <h3 className="font-bold text-lg text-foreground mb-1">
                    {phase.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {phase.subtitle}
                  </p>
                  <ul className="space-y-2.5">
                    {phase.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-foreground/80"
                      >
                        <CheckCircle2 className="h-4 w-4 text-forest-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:block relative">
            {/* Horizontal connector line */}
            <div className="absolute top-6 left-[calc(16.67%-8px)] right-[calc(16.67%-8px)] h-px bg-forest-200 z-0" />

            <div className="grid grid-cols-3 gap-6 lg:gap-8">
              {phases.map((phase, index) => (
                <motion.div
                  key={phase.number}
                  variants={itemVariants}
                  className="relative"
                >
                  {/* Numbered circle centered above card */}
                  <div className="flex justify-center mb-6">
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-forest-900 text-white font-bold text-lg">
                      {phase.number}
                    </div>
                  </div>

                  {/* Connector arrow between phases */}
                  {index < phases.length - 1 && (
                    <div className="hidden lg:flex absolute top-6 -right-4 lg:-right-5 z-10 text-forest-300">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}

                  {/* Content card */}
                  <div className="bg-secondary/60 rounded-3xl p-6 border border-border/40 h-full">
                    <h3 className="font-bold text-lg text-foreground mb-1">
                      {phase.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      {phase.subtitle}
                    </p>
                    <ul className="space-y-3">
                      {phase.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-foreground/80"
                        >
                          <CheckCircle2 className="h-4 w-4 text-forest-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
