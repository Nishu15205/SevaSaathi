"use client";

import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

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

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Main 4-column grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700">
                <Heart className="h-4 w-4 text-lime-400 fill-lime-400" />
              </div>
              <span className="text-lg font-bold text-white">
                Seva<span className="text-lime-400">Saathi</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              Verified home care & elder support platform. Connecting families
              with trusted caregivers across Delhi NCR.
            </p>
            <div className="space-y-3">
              <a
                href="tel:+911234567890"
                className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-lime-400 transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0" />
                +91 123 456 7890
              </a>
              <a
                href="mailto:hello@sevasaathi.in"
                className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-lime-400 transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0" />
                hello@sevasaathi.in
              </a>
              <div className="flex items-center gap-2.5 text-sm text-gray-400">
                <MapPin className="h-4 w-4 shrink-0" />
                Delhi NCR, India
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm text-white mb-5">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-lime-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} SevaSaathi. All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-lime-400 transition-all"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
