"use client";

import { motion } from "framer-motion";
import {
  UserPlus,
  Search,
  CalendarCheck,
  FileText,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Patient Profile",
    description:
      "Register and create a detailed patient profile with care requirements, medical history, and preferred schedule. Our form captures everything needed for the perfect match.",
    color: "from-teal-500 to-teal-600",
    bg: "bg-teal-50",
    iconBg: "bg-teal-100",
  },
  {
    number: "02",
    icon: Search,
    title: "Find & Compare Caregivers",
    description:
      "Our smart matching engine finds suitable verified caregivers based on skills, location, experience, and availability. Compare profiles, ratings, and reviews side by side.",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Book & Pay Securely",
    description:
      "Select your preferred caregiver, choose date and shift, and complete the booking with secure online payment. Receive instant confirmation and caregiver details.",
    color: "from-rose-500 to-rose-600",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
  },
  {
    number: "04",
    icon: FileText,
    title: "Monitor & Review",
    description:
      "Receive daily care reports with activity logs, medicine reminders, and updates. Track care quality in real-time and submit reviews after each completed booking.",
    color: "from-teal-600 to-teal-700",
    bg: "bg-teal-50",
    iconBg: "bg-teal-100",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
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

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white section-pattern">
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
            Simple Process
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How SevaSaathi Works
          </h2>
          <p className="text-muted-foreground text-lg">
            From finding the right caregiver to monitoring daily care — everything
            happens in four simple steps.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative group"
            >
              <div className="relative bg-white rounded-2xl p-6 lg:p-8 border border-border/60 card-hover h-full">
                {/* Connector line (not on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 -right-4 w-8 h-px bg-gradient-to-r from-teal-300 to-transparent" />
                )}

                {/* Step number */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.iconBg}`}
                  >
                    <step.icon className={`h-6 w-6 text-teal-700`} />
                  </div>
                  <span
                    className={`text-3xl font-extrabold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
