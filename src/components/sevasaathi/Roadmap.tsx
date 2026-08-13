"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  ShieldCheck,
  Search,
  CalendarCheck,
  FileText,
  CreditCard,
  Rocket,
} from "lucide-react";

const sprints = [
  {
    sprint: "Sprint 1",
    title: "Foundation",
    icon: Settings,
    items: [
      "Project setup & UI system",
      "Authentication & role management",
      "Family, caregiver, admin roles",
    ],
    phase: "MVP",
  },
  {
    sprint: "Sprint 2",
    title: "Profiles",
    icon: Users,
    items: [
      "Family & patient profile creation",
      "Caregiver professional profiles",
      "Care requirement forms",
    ],
    phase: "MVP",
  },
  {
    sprint: "Sprint 3",
    title: "Discovery",
    icon: Search,
    items: [
      "Verification workflow",
      "Search & filter system",
      "Smart matching engine",
    ],
    phase: "MVP",
  },
  {
    sprint: "Sprint 4",
    title: "Booking",
    icon: CalendarCheck,
    items: [
      "Booking & scheduling",
      "Status notifications",
      "Care report submission",
    ],
    phase: "MVP",
  },
  {
    sprint: "Sprint 5",
    title: "Engagement",
    icon: FileText,
    items: [
      "Reviews & ratings",
      "Admin dashboard",
      "Complaint management",
    ],
    phase: "MVP",
  },
  {
    sprint: "Phase 2",
    title: "Growth",
    icon: CreditCard,
    items: [
      "Payments integration",
      "Real-time chat",
      "Maps & push notifications",
      "Caregiver replacement workflow",
    ],
    phase: "Phase 2",
  },
  {
    sprint: "Phase 3",
    title: "Intelligence",
    icon: Rocket,
    items: [
      "AI-assisted requirement extraction",
      "Smarter matching algorithms",
      "Multilingual voice support",
      "Partner integrations",
    ],
    phase: "Phase 3",
  },
];

const metrics = [
  { label: "Caregiver verification completion", icon: ShieldCheck },
  { label: "Successful booking rate", icon: CalendarCheck },
  { label: "Booking acceptance rate", icon: Search },
  { label: "Repeat family bookings", icon: Users },
  { label: "Average rating", icon: FileText },
  { label: "Complaint rate", icon: CreditCard },
];

export default function Roadmap() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-3">
            Development Roadmap
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Building SevaSaathi
            <br />
            <span className="gradient-text">Step by Step</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A structured 8-sprint MVP followed by growth and intelligence
            phases. Starting with Delhi NCR, scaling across India.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Roadmap Timeline */}
          <div className="lg:col-span-2">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-teal-300 via-teal-200 to-amber-200 hidden sm:block" />

              <div className="space-y-4">
                {sprints.map((s, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    className="relative sm:pl-14"
                  >
                    {/* Timeline dot */}
                    <div className="hidden sm:flex absolute left-3.5 top-6 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm z-10"
                      style={{
                        background:
                          s.phase === "MVP"
                            ? "oklch(0.575 0.148 176)"
                            : s.phase === "Phase 2"
                            ? "oklch(0.769 0.188 70)"
                            : "oklch(0.645 0.246 16)",
                      }}
                    />

                    <div className="bg-warm-50 rounded-xl p-5 border border-border/30 group hover:border-teal-200 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                          <s.icon className="h-4 w-4 text-teal-700" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {s.sprint}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-2 py-0.5 border-0 ${
                              s.phase === "MVP"
                                ? "bg-teal-100 text-teal-700"
                                : s.phase === "Phase 2"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {s.phase}
                          </Badge>
                        </div>
                      </div>
                      <h4 className="font-bold text-sm mb-2">{s.title}</h4>
                      <ul className="space-y-1">
                        {s.items.map((item, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex items-start gap-2"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-gradient-to-br from-teal-50 to-amber-50/30 rounded-2xl p-6 border border-teal-100/60 sticky top-28">
              <h3 className="font-bold text-lg mb-6">Success Metrics</h3>
              <div className="space-y-4">
                {metrics.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/70"
                  >
                    <m.icon className="h-4 w-4 text-teal-600 shrink-0" />
                    <span className="text-sm text-foreground">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
