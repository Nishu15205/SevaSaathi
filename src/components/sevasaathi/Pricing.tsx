"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "Free",
    priceSuffix: "",
    priceLabel: "10% service fee per booking",
    popular: false,
    highlighted: false,
    features: [
      "Search & compare verified caregivers",
      "Book day / night / 12-hour shifts",
      "Daily care reports",
      "Post-booking reviews",
      "Basic matching",
      "Caregiver replacement support",
    ],
    cta: "Start Free",
  },
  {
    name: "Premium",
    price: "₹299",
    priceSuffix: "/mo",
    priceLabel: "5% service fee per booking",
    popular: true,
    highlighted: true,
    features: [
      "Everything in Basic",
      "Priority caregiver matching",
      "Detailed care analytics dashboard",
      "Priority support & chat",
      "Extended care reports (7-day)",
      "Push notifications & SMS alerts",
      "Care coordination assistance",
    ],
    cta: "Subscribe Now",
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceSuffix: "",
    priceLabel: "3% service fee per booking",
    popular: false,
    highlighted: false,
    features: [
      "Everything in Premium",
      "Dedicated account manager",
      "Bulk caregiver booking",
      "Custom care packages",
      "API integration options",
      "White-label solution",
      "SLA-backed support",
    ],
    cta: "Contact Sales",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function Pricing({ onOpenLogin }: { onOpenLogin: (action?: string) => void }) {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-white">
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
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Start free with per-booking fees, or upgrade for priority matching
            and advanced care features.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start"
        >
          {plans.map((plan) => {
            const isHighlighted = plan.highlighted;

            return (
              <motion.div
                key={plan.name}
                variants={cardVariants}
                className={`relative rounded-2xl p-6 lg:p-8 border card-hover ${
                  isHighlighted
                    ? "green-gradient-bg border-forest-700 text-white"
                    : "bg-white border-gray-200"
                }`}
              >
                {/* Most Popular Badge */}
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime-400 text-forest-900 text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                {/* Plan Name */}
                <h3
                  className={`text-lg font-semibold mb-1 ${
                    isHighlighted ? "text-white" : "text-foreground"
                  }`}
                >
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-extrabold ${
                        isHighlighted ? "text-white" : "gradient-text"
                      }`}
                    >
                      {plan.price}
                    </span>
                    {plan.priceSuffix && (
                      <span
                        className={`text-sm ${
                          isHighlighted
                            ? "text-forest-200"
                            : "text-muted-foreground"
                        }`}
                      >
                        {plan.priceSuffix}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isHighlighted
                        ? "text-forest-200"
                        : "text-muted-foreground"
                    }`}
                  >
                    {plan.priceLabel}
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      window.open("mailto:hello@sevasaathi.in?subject=Enterprise%20Plan%20Inquiry");
                    } else {
                      onOpenLogin(plan.name === 'Premium' ? 'register' : undefined);
                    }
                  }}
                  className={`w-full py-3 px-6 rounded-full font-semibold text-sm transition-all duration-200 mb-6 cursor-pointer ${
                    isHighlighted
                      ? "bg-white text-forest-900 hover:bg-lime-100"
                      : "btn-black"
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Feature List */}
                <div className="space-y-3">
                  {plan.features.map((feature, fi) => (
                    <div key={fi} className="flex items-start gap-3">
                      <Check
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          isHighlighted
                            ? "text-lime-400"
                            : "text-forest-600"
                        }`}
                      />
                      <span
                        className={`text-sm leading-relaxed ${
                          isHighlighted
                            ? "text-forest-100"
                            : "text-muted-foreground"
                        }`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-10"
        >
          Illustrative pricing. Actual costs may vary based on care type, duration,
          and location.
        </motion.p>
      </div>
    </section>
  );
}
