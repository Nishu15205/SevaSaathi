"use client";

import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";

export default function CTASection({ onOpenLogin }: { onOpenLogin: () => void }) {
  return (
    <section className="py-20 lg:py-28 green-gradient-bg relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-forest-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-6">
            Ready to find the
            <br className="hidden sm:block" /> perfect caregiver?
          </h2>

          <p className="text-white/80 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Join thousands of families who trust SevaSaathi for verified,
            reliable home care across Delhi NCR.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={onOpenLogin}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-forest-900 font-semibold px-8 py-3.5 text-base transition-colors hover:bg-lime-100 cursor-pointer"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </motion.button>

            <motion.a
              href="mailto:hello@sevasaathi.in?subject=Inquiry%20from%20SevaSaathi%20Website"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 text-white font-semibold px-8 py-3.5 text-base transition-all hover:bg-white/10 hover:border-white/70"
            >
              <Phone className="h-4 w-4" />
              Contact Us
            </motion.a>
          </div>

          <p className="text-white/50 text-sm mt-8">
            Currently serving Delhi NCR. Expanding to other Indian cities soon.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
