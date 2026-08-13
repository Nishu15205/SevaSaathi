"use client";

import { motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  CalendarCheck,
  FileText,
  Monitor,
  Star,
  AlertTriangle,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Caregiver Matching",
    description:
      "Our rule-based scoring engine matches caregivers by skills, location, experience, availability, and reliability score — so you find the best fit every time.",
    highlight: "30% skill match weight",
  },
  {
    icon: ShieldCheck,
    title: "Verified Profiles",
    description:
      "Every caregiver submits identity and qualification documents. Our admin team verifies credentials before publishing profiles — only verified caregivers appear in search results.",
    highlight: "ID + qualification verified",
  },
  {
    icon: CalendarCheck,
    title: "Booking & Scheduling",
    description:
      "Select date, shift duration, and specific care requirements. Caregivers manage their own availability, so you always see real-time open slots.",
    highlight: "Day / night / 12-hour shifts",
  },
  {
    icon: FileText,
    title: "Daily Care Reports",
    description:
      "Caregivers log routine activities including food intake, hygiene support, mobility assistance, and medicine reminders. Families receive detailed daily summaries.",
    highlight: "Activity-by-activity logging",
  },
  {
    icon: Monitor,
    title: "Family Monitoring",
    description:
      "Track booking status, view caregiver details, receive real-time notifications, and access care reports from anywhere — whether you're in another city or country.",
    highlight: "Real-time notifications",
  },
  {
    icon: AlertTriangle,
    title: "Urgent Care Coordination",
    description:
      "Need a caregiver immediately? Create an urgent request and we prioritize available verified caregivers in your area. For medical emergencies, we direct you to appropriate services.",
    highlight: "Priority matching for urgent needs",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function Features() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-warm-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-semibold text-amber-600 tracking-wider uppercase mb-3">
            Core Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything You Need for
            <br />
            <span className="gradient-text">Home Care Management</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From finding the right caregiver to tracking daily care, SevaSaathi
            provides an end-to-end platform built around trust and transparency.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group bg-white rounded-2xl p-6 lg:p-8 border border-border/40 card-hover"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 mb-5 group-hover:bg-teal-200 transition-colors">
                <feature.icon className="h-6 w-6 text-teal-700" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {feature.description}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-xs font-medium text-amber-700">
                  {feature.highlight}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
