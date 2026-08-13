"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Anjali Mehta",
    role: "Daughter, Delhi",
    avatar: "AM",
    rating: 5,
    text: "My mother needs 24/7 care after her hip surgery. SevaSaathi found us a wonderful nurse who has been with us for three months now. The daily care reports give me such peace of mind while I am at work.",
  },
  {
    name: "Rajesh Kumar",
    role: "Son, Noida",
    avatar: "RK",
    rating: 5,
    text: "I live in Bangalore and my parents are in Noida. Being able to monitor care from 2,000 km away through daily reports and notifications has been life-changing. The caregiver matching was spot on.",
  },
  {
    name: "Priya Sharma",
    role: "Verified Caregiver",
    avatar: "PS",
    rating: 5,
    text: "As a trained nurse, I was tired of unreliable agencies. SevaSaathi gave me a platform where my skills and verification actually matter. I get genuine work opportunities with fair pay and respectful families.",
  },
  {
    name: "Dr. Sunita Agarwal",
    role: "Geriatrician, Delhi NCR",
    avatar: "SA",
    rating: 5,
    text: "I regularly recommend SevaSaathi to my patients\' families. The verification process and daily care reporting system are exactly what home care needs in India. It brings professionalism to an informal sector.",
  },
  {
    name: "Vikram Singh",
    role: "RWA President, Dwarka",
    avatar: "VS",
    rating: 4,
    text: "Our RWA partnered with SevaSaathi to help senior residents find reliable home care. The platform\'s transparency and structured approach have been well-received by our community members.",
  },
  {
    name: "Meera Patel",
    role: "Daughter-in-law, Gurgaon",
    avatar: "MP",
    rating: 5,
    text: "The urgent care feature was a lifesaver when our regular caregiver fell ill suddenly. Within hours, SevaSaathi arranged a verified replacement. That responsiveness is why I trust this platform.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-white">
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
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Trusted by Families
            <br />
            <span className="gradient-text">Across Delhi NCR</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Real stories from families, caregivers, and healthcare professionals
            who rely on SevaSaathi.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="bg-gradient-to-br from-warm-50 to-white rounded-2xl p-6 border border-border/40 card-hover"
            >
              <Quote className="h-8 w-8 text-teal-200 mb-4" />
              <p className="text-sm text-foreground leading-relaxed mb-6">
                {t.text}
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-sm font-semibold">
                    {t.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 text-amber-500 fill-amber-500"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
