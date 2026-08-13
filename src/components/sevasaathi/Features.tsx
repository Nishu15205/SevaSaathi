"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const careCards = [
  { name: "Elderly Care", image: "/elderly-care-1.png" },
  { name: "Post-Surgery", image: "/elderly-care-2.png" },
  { name: "Nursing at Home", image: "/nurse-portrait-1.png" },
  { name: "Patient Care", image: "/nurse-portrait-2.png" },
  { name: "Family Support", image: "/family-care.png" },
  { name: "Medication", image: "/medicine-care.png" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-[#f9fafb]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Get care for:
          </h2>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">
            From daily assistance to specialized nursing, find the right care
            for every situation.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {careCards.map((card) => (
            <motion.div
              key={card.name}
              variants={cardVariants}
              className="group relative rounded-2xl overflow-hidden cursor-pointer bg-white border border-gray-100 transition-transform duration-300 hover:scale-[1.03]"
            >
              <div className="relative w-full aspect-[4/3] overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="flex items-center justify-between px-5 py-4 bg-[#111111]">
                <span className="text-white font-semibold text-sm sm:text-base">
                  {card.name}
                </span>
                <ArrowRight className="h-4 w-4 text-white/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
