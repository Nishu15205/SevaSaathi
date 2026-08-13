"use client";

import { Heart, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Platform: [
    { label: "Find Caregiver", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Smart Matching", href: "#matching" },
    { label: "Pricing", href: "#pricing" },
    { label: "Trust & Safety", href: "#trust" },
  ],
  "For Caregivers": [
    { label: "Become a Caregiver", href: "#" },
    { label: "Verification Process", href: "#trust" },
    { label: "Caregiver Dashboard", href: "#" },
    { label: "Earnings & Payments", href: "#pricing" },
  ],
  Company: [
    { label: "About SevaSaathi", href: "#" },
    { label: "Our Mission", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-warm-100 to-warm-50 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700">
                <Heart className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="gradient-text">Seva</span>
                <span className="text-foreground">Saathi</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
              Verified home care & elder support platform. Connecting families
              with trusted caregivers across Delhi NCR.
            </p>
            <div className="space-y-2.5">
              <a
                href="tel:+911234567890"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-700 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                +91 123 456 7890
              </a>
              <a
                href="mailto:hello@sevasaathi.in"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-700 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                hello@sevasaathi.in
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Delhi NCR, India
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-teal-700 transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-border/40" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SevaSaathi. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Currently serving Delhi NCR. Expanding to other cities soon.
          </p>
        </div>
      </div>
    </footer>
  );
}
