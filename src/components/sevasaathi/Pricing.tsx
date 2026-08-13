"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Building2 } from "lucide-react";

const plans = [
  {
    name: "Basic",
    subtitle: "Pay per booking",
    price: "10%",
    priceLabel: "platform fee per booking",
    icon: Zap,
    color: "teal",
    popular: false,
    features: [
      "Search & compare verified caregivers",
      "Book day/night/12-hour shifts",
      "Receive daily care reports",
      "Post-booking reviews",
      "Basic notifications",
      "Caregiver replacement support",
    ],
    cta: "Start Free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Premium Family",
    subtitle: "Best for regular care",
    price: "₹299",
    priceSuffix: "/month",
    priceLabel: "starting from",
    icon: Star,
    color: "amber",
    popular: true,
    features: [
      "Everything in Basic",
      "Priority caregiver matching",
      "Detailed care analytics dashboard",
      "Priority support & chat",
      "Care coordination assistance",
      "Extended care reports (7-day history)",
      "Push notifications & SMS alerts",
    ],
    cta: "Subscribe Now",
    ctaVariant: "default" as const,
  },
  {
    name: "Enterprise",
    subtitle: "For RWAs & organizations",
    price: "Custom",
    priceLabel: "tailored for your needs",
    icon: Building2,
    color: "rose",
    popular: false,
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
    ctaVariant: "outline" as const,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-warm-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Start with pay-per-booking or upgrade to Premium for priority care
            coordination and advanced features.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative bg-white rounded-2xl p-6 lg:p-8 border card-hover ${
                plan.popular
                  ? "border-teal-300 shadow-lg shadow-teal-100/50"
                  : "border-border/40"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-teal-700 text-white border-0 shadow-md">
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${
                    plan.color === "teal"
                      ? "bg-teal-100"
                      : plan.color === "amber"
                      ? "bg-amber-100"
                      : "bg-rose-100"
                  }`}
                >
                  <plan.icon
                    className={`h-5 w-5 ${
                      plan.color === "teal"
                        ? "text-teal-700"
                        : plan.color === "amber"
                        ? "text-amber-700"
                        : "text-rose-700"
                    }`}
                  />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.subtitle}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold gradient-text">
                    {plan.price}
                  </span>
                  {plan.priceSuffix && (
                    <span className="text-sm text-muted-foreground">
                      {plan.priceSuffix}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.priceLabel}
                </p>
              </div>

              <Button
                variant={plan.ctaVariant}
                className={`w-full mb-6 h-11 ${
                  plan.ctaVariant === "default"
                    ? "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-md shadow-teal-200/50"
                    : "border-teal-200 text-teal-700 hover:bg-teal-50"
                }`}
              >
                {plan.cta}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, fi) => (
                  <div key={fi} className="flex items-start gap-2.5">
                    <Check
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        plan.color === "teal"
                          ? "text-teal-600"
                          : plan.color === "amber"
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Unit economics note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Illustrative pricing. Actual costs may vary based on care type, duration, and location. Care packages available for long-term arrangements.
        </p>
      </div>
    </section>
  );
}
