"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Stethoscope,
  MapPin,
  Briefcase,
  Clock,
  Star,
  MessageSquare,
  Sparkles,
  UserCheck,
  ArrowRight,
} from "lucide-react";

const matchingWeights = [
  { label: "Skill", weight: 30, icon: Stethoscope },
  { label: "Location", weight: 25, icon: MapPin },
  { label: "Experience", weight: 20, icon: Briefcase },
  { label: "Availability", weight: 15, icon: Clock },
  { label: "Rating", weight: 10, icon: Star },
];

const steps = [
  {
    number: "01",
    title: "Tell us your needs",
    description: "Describe the care you need, preferred schedule, and location.",
    icon: MessageSquare,
  },
  {
    number: "02",
    title: "AI finds matches",
    description: "Our engine scores and ranks caregivers across five key factors.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Choose your caregiver",
    description: "Review verified profiles, ratings, and book instantly.",
    icon: UserCheck,
  },
];

function ProgressBar({
  label,
  weight,
  icon: Icon,
  delay,
}: {
  label: string;
  weight: number;
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50">
            <Icon className="h-4 w-4 text-forest-800" />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold text-forest-900">{weight}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-forest-50 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #14532d ${0}%, #15803d ${Math.min(weight * 2, 70)}%, #a3e635 100%)`,
          }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${weight * 3.33}%` } : { width: 0 }}
          transition={{
            duration: 0.9,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
    </div>
  );
}

export default function SmartMatching({ onOpenLogin }: { onOpenLogin: () => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section id="matching" className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <motion.div
          ref={sectionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl mx-auto mb-16"
        >
          <p className="text-sm font-semibold text-forest-700 tracking-wider uppercase mb-3">
            Intelligent Matching
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Our Smart Matching Engine
          </h2>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
            Every match is calculated across five weighted dimensions so your
            family gets the most qualified, nearest, and most available caregiver
            — in seconds.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left – Explanation */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              How we find the right caregiver for you
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              When you submit a care request, our scoring engine evaluates every
              verified caregiver in your area. Each candidate receives a weighted
              score based on how well their skills, proximity, experience,
              schedule, and track record align with your specific needs.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The result is a ranked list of best-fit caregivers — so you can
              review profiles, compare ratings, and book with confidence.
            </p>

            {/* Progress bars */}
            <div className="pt-4 space-y-5">
              {matchingWeights.map((item, index) => (
                <ProgressBar
                  key={item.label}
                  label={item.label}
                  weight={item.weight}
                  icon={item.icon}
                  delay={index * 0.15 + 0.2}
                />
              ))}
            </div>
          </motion.div>

          {/* Right – How it works 3-step flow */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="rounded-3xl border border-forest-100 bg-forest-50/40 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-foreground mb-8">
                How it works
              </h3>

              <div className="relative space-y-0">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.3 + index * 0.15,
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                  >
                    <div className="flex gap-4 pb-8">
                      {/* Icon circle */}
                      <div className="flex flex-col items-center">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#14532d]">
                          <step.icon className="h-5 w-5 text-white" />
                        </div>
                        {index < steps.length - 1 && (
                          <div className="w-px flex-1 mt-2 bg-forest-200" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pt-1">
                        <p className="text-xs font-bold text-forest-700 uppercase tracking-widest mb-1">
                          Step {step.number}
                        </p>
                        <h4 className="text-base font-bold text-foreground mb-1">
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="mt-2"
              >
                <button onClick={onOpenLogin} className="btn-black inline-flex items-center gap-2 px-6 py-3 text-sm">
                  Find a caregiver
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
