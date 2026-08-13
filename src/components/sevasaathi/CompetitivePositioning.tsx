"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const comparisons = [
  {
    feature: "End-to-End Care Workflow",
    typical: false,
    sevasaathi: true,
  },
  {
    feature: "Verified Profiles + Admin Review",
    typical: false,
    sevasaathi: true,
  },
  {
    feature: "Daily Care Reports & Updates",
    typical: false,
    sevasaathi: true,
  },
  {
    feature: "Requirement-Based Smart Matching",
    typical: false,
    sevasaathi: true,
  },
  {
    feature: "Family Monitoring & Notifications",
    typical: false,
    sevasaathi: true,
  },
  {
    feature: "Booking + Schedule + Replacement",
    typical: false,
    sevasaathi: true,
  },
  {
    feature: "Contact Discovery Only",
    typical: true,
    sevasaathi: false,
  },
  {
    feature: "Manual Caregiver Selection",
    typical: true,
    sevasaathi: false,
  },
  {
    feature: "Limited Family Visibility",
    typical: true,
    sevasaathi: false,
  },
];

export default function CompetitivePositioning() {
  return (
    <section className="py-20 lg:py-28 bg-warm-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-3">
            Why SevaSaathi
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Not Just Another Directory
          </h2>
          <p className="text-muted-foreground text-lg">
            Unlike informal caregiver searches, SevaSaathi provides a complete care
            management platform built around trust.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm"
        >
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
            <div className="p-4 font-semibold text-sm">Feature</div>
            <div className="p-4 font-semibold text-sm text-center">
              Typical Directory
            </div>
            <div className="p-4 font-semibold text-sm text-center">
              SevaSaathi
            </div>
          </div>

          {/* Table Rows */}
          {comparisons.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 border-b border-border/30 last:border-0 ${
                index % 2 === 0 ? "bg-white" : "bg-warm-50/50"
              }`}
            >
              <div className="p-4 text-sm font-medium">{row.feature}</div>
              <div className="p-4 flex justify-center">
                {row.typical ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Check className="h-3 w-3" />
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    <X className="h-3 w-3" />
                    No
                  </span>
                )}
              </div>
              <div className="p-4 flex justify-center">
                {row.sevasaathi ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                    <Check className="h-3 w-3" />
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    <X className="h-3 w-3" />
                    No
                  </span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
