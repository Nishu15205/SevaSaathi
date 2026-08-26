"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const comparisons = [
  {
    feature: "Verified Caregivers",
    sevasaathi: true,
    typical: false,
  },
  {
    feature: "Smart Matching",
    sevasaathi: true,
    typical: false,
  },
  {
    feature: "Real-time Updates",
    sevasaathi: true,
    typical: false,
  },
  {
    feature: "Care Reports",
    sevasaathi: true,
    typical: false,
  },
  {
    feature: "Reviews & Ratings",
    sevasaathi: true,
    typical: false,
  },
  {
    feature: "Background Checks",
    sevasaathi: true,
    typical: false,
  },
];

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function CompetitivePositioning() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-forest-700 tracking-wider uppercase mb-3">
            Why SevaSaathi
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Not Just Another Directory
          </h2>
          <p className="text-muted-foreground text-lg">
            SevaSaathi provides a complete care management platform built
            around trust and transparency.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl border border-gray-200 overflow-hidden"
        >
          {/* Header Row */}
          <div className="grid grid-cols-3">
            <div className="p-4 text-sm font-semibold text-foreground bg-gray-50">
              Feature
            </div>
            <div className="p-4 text-sm font-semibold text-center text-muted-foreground bg-gray-50">
              Typical Agencies
            </div>
            <div className="p-4 text-sm font-semibold text-center text-white green-gradient-bg">
              SevaSaathi
            </div>
          </div>

          {/* Data Rows */}
          {comparisons.map((row, index) => (
            <motion.div
              key={row.feature}
              custom={index}
              variants={rowVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={`grid grid-cols-3 border-t border-gray-100 ${
                index % 2 === 0 ? "bg-white" : "bg-forest-50/40"
              }`}
            >
              <div className="p-4 text-sm font-medium text-foreground">
                {row.feature}
              </div>

              {/* Typical Agencies Column */}
              <div className="p-4 flex justify-center">
                {row.typical ? (
                  <Check className="h-4 w-4 text-forest-600" />
                ) : (
                  <X className="h-4 w-4 text-red-400" />
                )}
              </div>

              {/* SevaSaathi Column */}
              <div className="p-4 flex justify-center bg-forest-50/30">
                {row.sevasaathi ? (
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-lime-400">
                    <Check className="h-3.5 w-3.5 text-forest-900" />
                  </span>
                ) : (
                  <X className="h-4 w-4 text-red-400" />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
