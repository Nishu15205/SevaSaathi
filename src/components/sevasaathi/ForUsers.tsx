"use client";

import { motion } from "framer-motion";
import { Heart, Stethoscope, Shield, CheckCircle2 } from "lucide-react";

type CardData = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  features: string[];
};

const cards: CardData[] = [
  {
    icon: Heart,
    title: "For Families",
    subtitle: "Find & monitor quality home care",
    features: [
      "Browse verified caregivers by skills, location & rating",
      "Book flexible care sessions — day, night or custom shifts",
      "Receive structured daily care reports",
      "Real-time alerts for caregiver arrival & updates",
      "Rate caregivers and help other families decide",
    ],
  },
  {
    icon: Stethoscope,
    title: "For Caregivers",
    subtitle: "Access genuine work opportunities",
    features: [
      "Showcase skills, experience & verification status",
      "Get verified and appear higher in search results",
      "Accept jobs that match your availability",
      "Receive secure, transparent payments",
      "Submit daily care reports with minimal effort",
    ],
  },
  {
    icon: Shield,
    title: "For Admins",
    subtitle: "Full control over the care ecosystem",
    features: [
      "Review & verify caregiver documents and qualifications",
      "Manage family, caregiver & admin accounts",
      "Monitor all bookings and handle rescheduling",
      "Track platform revenue and caregiver payouts",
      "Resolve complaints with structured escalation workflows",
    ],
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

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function ForUsers() {
  return (
    <section id="for-users" className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <p className="text-sm font-semibold text-forest-600 tracking-wider uppercase mb-3">
            Tailored for every user
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-forest-900 mb-4">
            Built for Everyone
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Whether you&apos;re seeking care, providing it, or managing the
            platform — SevaSaathi has you covered.
          </p>
        </motion.div>

        {/* 3-Column Card Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                variants={cardVariants}
                className="rounded-2xl border border-gray-100 bg-white p-6 lg:p-8 card-hover"
              >
                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50 mb-5">
                  <Icon className="h-6 w-6 text-forest-700" />
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-xl font-bold text-forest-900 mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-400 mb-6">{card.subtitle}</p>

                {/* Feature List */}
                <ul className="space-y-3">
                  {card.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-lime-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
