"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Brain,
  MapPin,
  Briefcase,
  Clock,
  Star,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const matchingFactors = [
  {
    icon: Stethoscope,
    label: "Skill / Requirement Match",
    weight: 30,
    color: "bg-teal-500",
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
    example: "Bedridden care, feeding, mobility support",
  },
  {
    icon: MapPin,
    label: "Location / Travel Fit",
    weight: 25,
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    example: "Caregiver within 5km of patient",
  },
  {
    icon: Briefcase,
    label: "Experience",
    weight: 20,
    color: "bg-rose-500",
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    example: "3+ years relevant experience",
  },
  {
    icon: Clock,
    label: "Availability",
    weight: 15,
    color: "bg-violet-500",
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    example: "Available for 12-hour night shift",
  },
  {
    icon: Star,
    label: "Rating & Reliability",
    weight: 10,
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    example: "4.5+ rating, 50+ completed bookings",
  },
];

const exampleFlow = [
  {
    step: "Family Request",
    text: "Female caregiver for 12-hour night shift in Janakpuri with bedridden-care and feeding experience",
    icon: "👩",
  },
  {
    step: "Engine Filters",
    text: "Availability → Night shift capable candidates in Janakpuri area",
    icon: "🔍",
  },
  {
    step: "Ranked Results",
    text: "Top candidates ranked by skill fit (30%), location (25%), experience (20%), reliability (10%)",
    icon: "📊",
  },
  {
    step: "Best Match",
    text: "Priya Sharma — 4.8★, 5 years experience, 2km away, verified bedridden care specialist",
    icon: "✅",
  },
];

export default function SmartMatching() {
  return (
    <section id="matching" className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Weight visualization */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-3">
              Intelligent Matching
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Smart Caregiver
              <br />
              <span className="gradient-text">Matching Engine</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Our rule-based scoring engine evaluates each caregiver across five
              key dimensions to find the perfect match for your family&apos;s needs.
            </p>

            <div className="space-y-5">
              {matchingFactors.map((factor, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        className="flex items-center gap-4 cursor-default"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${factor.bgColor}`}
                        >
                          <factor.icon className={`h-5 w-5 ${factor.textColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium truncate">
                              {factor.label}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`ml-2 shrink-0 ${factor.bgColor} ${factor.textColor} border-0 text-xs`}
                            >
                              {factor.weight}%
                            </Badge>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${factor.weight * 3.33}%` }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 0.8,
                                delay: index * 0.15 + 0.3,
                                ease: "easeOut",
                              }}
                              className={`h-full rounded-full ${factor.color}`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{factor.example}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </motion.div>

          {/* Right - Example flow */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-teal-50 to-amber-50/30 rounded-3xl p-6 sm:p-8 border border-teal-100/60">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-lg">Matching in Action</h3>
              </div>

              <div className="space-y-4">
                {exampleFlow.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.15, duration: 0.4 }}
                  >
                    <div className="bg-white rounded-xl p-4 border border-border/40 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
                            {item.step}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.text}
                          </p>
                        </div>
                        {index < exampleFlow.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1 shrink-0 hidden sm:block" />
                        )}
                      </div>
                    </div>
                    {index < exampleFlow.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="w-px h-4 bg-teal-200" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-white rounded-xl border border-green-200/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-semibold text-green-700">
                    Best match found in under 2 seconds
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
