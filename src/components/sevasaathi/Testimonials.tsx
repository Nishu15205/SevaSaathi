"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Gurugram",
    role: "Daughter",
    rating: 5,
    text: "My mother needed full-time care after her surgery. SevaSaathi found us a wonderful nurse who has been with us for three months. The daily care reports give me such peace of mind while I'm at work.",
  },
  {
    name: "Rajesh Gupta",
    location: "Delhi",
    role: "Son",
    rating: 5,
    text: "Post-surgery care for my father was stressful until we found SevaSaathi. The smart matching connected us with the perfect caregiver in under 24 hours. Real-time updates made all the difference.",
  },
  {
    name: "Anita Verma",
    location: "Noida",
    role: "Granddaughter",
    rating: 5,
    text: "Finding an elderly companion for my grandmother felt impossible. SevaSaathi's platform made it simple — verified caregivers, transparent reviews, and a care report every single day. Truly a lifesaver.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-[#f9fafb]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-semibold text-forest-700 tracking-wider uppercase mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            What Families Say
          </h2>
          <p className="text-muted-foreground text-lg">
            Real stories from families across Delhi NCR who trust SevaSaathi
            for their loved ones' care.
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto"
        >
          {testimonials.map((t) => {
            const initial = t.name.charAt(0);

            return (
              <motion.div
                key={t.name}
                variants={cardVariants}
                className="rounded-2xl bg-white border border-gray-100 p-6 card-hover"
              >
                {/* Star Rating */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-lime-500 fill-lime-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-900 text-white text-sm font-bold shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.role}, {t.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
