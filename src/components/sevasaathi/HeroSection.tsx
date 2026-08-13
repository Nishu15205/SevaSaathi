"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CalendarCheck,
  Monitor,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const stats = [
  { icon: ShieldCheck, value: "500+", label: "Verified Caregivers" },
  { icon: Users, value: "2,000+", label: "Families Served" },
  { icon: Star, value: "4.8", label: "Average Rating" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen hero-gradient overflow-hidden pt-20 lg:pt-24">
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-100/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-5rem)]">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <Badge
              variant="secondary"
              className="w-fit bg-teal-100 text-teal-800 border-teal-200 px-4 py-1.5 text-sm font-medium"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              Trusted by 2,000+ families across Delhi NCR
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Find the{" "}
              <span className="gradient-text">Right Caregiver</span>{" "}
              for Your Loved Ones
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              SevaSaathi connects families with verified nurses and caregivers
              for elderly care, bedridden patient support, and everyday
              home assistance. Book confidently. Monitor from anywhere.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg shadow-teal-200/50 text-base px-8 h-12"
              >
                <Search className="h-4 w-4 mr-2" />
                Find a Caregiver
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-teal-200 text-teal-700 hover:bg-teal-50 text-base px-8 h-12"
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
                Book Care Now
              </Button>
            </div>

            {/* Quick value props */}
            <div className="flex flex-wrap gap-4 mt-4">
              {[Search, CalendarCheck, Monitor].map((Icon, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                    <Icon className="h-4 w-4 text-teal-700" />
                  </div>
                  <span className="font-medium text-foreground">
                    {["Find", "Book", "Monitor"][i]}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-teal-900/10">
              <Image
                src="/hero-illustration.png"
                alt="SevaSaathi - Caring nurse helping elderly patient at home"
                width={1344}
                height={768}
                className="w-full h-auto object-cover"
                priority
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-teal-900/10 to-transparent" />
            </div>

            {/* Floating stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-4 -left-4 sm:left-4 bg-white rounded-2xl shadow-xl p-4 border border-teal-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verified</p>
                  <p className="font-semibold text-sm">100% Background Check</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -top-4 -right-4 sm:right-4 bg-white rounded-2xl shadow-xl p-4 border border-amber-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Star className="h-5 w-5 text-amber-600 fill-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="font-semibold text-sm">4.8 Star Rating</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-16 lg:mt-24 pb-16"
        >
          <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-teal-100/60 shadow-lg shadow-teal-900/5 p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-4 justify-center sm:justify-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-teal-50">
                    <stat.icon className="h-6 w-6 text-teal-700" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold gradient-text">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
