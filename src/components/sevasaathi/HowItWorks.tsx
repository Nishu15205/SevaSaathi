"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const steps = [
  {
    number: "01",
    image: "/nurse-portrait-1.png",
    imageAlt: "Verified nurse ready for home care",
    title: "Tell Us Your Needs",
    description:
      "Share your care requirements, preferred schedule, and budget. Our simple form captures everything needed for the perfect match.",
  },
  {
    number: "02",
    image: "/elderly-care-1.png",
    imageAlt: "Elderly woman receiving personalized home care",
    title: "Get Matched Instantly",
    description:
      "Our smart engine pairs you with verified caregivers based on skills, location, and experience. Compare profiles side by side.",
  },
  {
    number: "03",
    image: "/family-care.png",
    imageAlt: "Family together with elderly loved one",
    title: "Book & Monitor Care",
    description:
      "Select your caregiver, book securely online, and receive daily care reports with real-time updates.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl mx-auto mb-16 lg:mb-20"
        >
          <p className="text-sm font-semibold text-forest-900 tracking-wider uppercase mb-3">
            Simple Process
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Three simple steps to get the right care for your family member.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative"
        >
          <div className="hidden lg:block absolute top-24 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-forest-200 via-lime-300 to-forest-200" />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step) => (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative z-10 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-900 text-white text-lg font-bold border-4 border-white shadow-lg shadow-forest-900/15">
                    {step.number}
                  </div>
                </div>

                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-gray-100">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <h3 className="text-xl font-bold mb-3 text-forest-900">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
