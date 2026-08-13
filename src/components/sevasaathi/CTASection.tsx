"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, Phone, ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800" />
      <div className="absolute inset-0 section-pattern opacity-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
            Make Home Care Easier to Find,
            <br />
            Easier to Trust
          </h2>
          <p className="text-teal-100 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Join thousands of families who trust SevaSaathi for verified,
            reliable home care. Your loved ones deserve the best — and so do you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-teal-700 hover:bg-teal-50 shadow-xl shadow-teal-900/20 text-base px-8 h-12"
            >
              <Search className="h-4 w-4 mr-2" />
              Find a Caregiver
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 text-base px-8 h-12"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Helpline
            </Button>
          </div>

          <p className="text-teal-200/70 text-sm mt-6">
            Currently serving Delhi NCR. Expanding to other Indian cities soon.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
