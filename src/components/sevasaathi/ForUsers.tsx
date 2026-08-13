"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  FileText,
  Bell,
  Star,
  CreditCard,
  UserCog,
  Briefcase,
  CalendarCheck,
  ShieldCheck,
  IndianRupee,
  ClipboardList,
  Heart,
  Home,
  Clock,
  MessageSquare,
} from "lucide-react";

const familyFeatures = [
  {
    icon: Users,
    title: "Patient Profile Management",
    description: "Create detailed profiles for elderly family members with medical conditions, dietary needs, and care preferences.",
  },
  {
    icon: Search,
    title: "Caregiver Discovery",
    description: "Browse verified caregivers filtered by skills, location, availability, rating, and price. Compare profiles side by side.",
  },
  {
    icon: CalendarCheck,
    title: "Easy Booking",
    description: "Book care sessions with flexible scheduling — day shifts, night shifts, or 12-hour custom durations.",
  },
  {
    icon: FileText,
    title: "Daily Care Reports",
    description: "Receive structured daily reports covering food, hygiene, mobility, medicine reminders, and overall well-being.",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description: "Stay informed with instant alerts for booking confirmations, caregiver arrival, and care updates.",
  },
  {
    icon: Star,
    title: "Reviews & Feedback",
    description: "Rate caregivers after each session and help other families make informed decisions.",
  },
];

const caregiverFeatures = [
  {
    icon: UserCog,
    title: "Professional Profile",
    description: "Showcase your skills, experience, qualifications, and verification status to attract genuine families.",
  },
  {
    icon: ShieldCheck,
    title: "Verification Badge",
    description: "Get verified through our admin review process. Verified caregivers get priority in search results.",
  },
  {
    icon: Briefcase,
    title: "Job Opportunities",
    description: "Access a steady stream of genuine care requests from families. Set your availability and accept jobs that fit.",
  },
  {
    icon: CalendarCheck,
    title: "Availability Management",
    description: "Manage your weekly schedule, set available slots, and control when you want to work.",
  },
  {
    icon: IndianRupee,
    title: "Secure Payments",
    description: "Receive payments directly to your account after completed sessions. Transparent fee structure, no hidden charges.",
  },
  {
    icon: ClipboardList,
    title: "Care Report Tools",
    description: "Submit structured daily care reports with minimal effort using our easy-to-use reporting interface.",
  },
];

const adminFeatures = [
  {
    icon: ShieldCheck,
    title: "Profile Verification",
    description: "Review and verify caregiver identity documents, qualifications, and background checks before publishing profiles.",
  },
  {
    icon: Users,
    title: "User Management",
    description: "Manage family, caregiver, and admin accounts. Handle onboarding, deactivation, and access control.",
  },
  {
    icon: ClipboardList,
    title: "Booking Oversight",
    description: "Monitor all bookings, handle rescheduling, manage cancellations, and oversee caregiver replacements.",
  },
  {
    icon: CreditCard,
    title: "Payment Management",
    description: "Track platform revenue, manage caregiver payouts, and handle refund requests through the admin dashboard.",
  },
  {
    icon: MessageSquare,
    title: "Complaint Resolution",
    description: "Review and resolve family complaints with structured escalation workflows and resolution tracking.",
  },
  {
    icon: Heart,
    title: "Analytics Dashboard",
    description: "Track key metrics — active families, booking rates, caregiver reliability, satisfaction scores, and revenue trends.",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 p-4 rounded-xl hover:bg-white/60 transition-colors group"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 group-hover:bg-teal-200 transition-colors">
        <Icon className="h-5 w-5 text-teal-700" />
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export default function ForUsers() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-warm-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-3">
            Built for Everyone
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Tailored for Every User
          </h2>
          <p className="text-muted-foreground text-lg">
            Whether you&apos;re a family seeking care, a caregiver looking for
            work, or an admin managing operations — SevaSaathi has you covered.
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="families" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-warm-100/60">
            <TabsTrigger
              value="families"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Families
            </TabsTrigger>
            <TabsTrigger
              value="caregivers"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
            >
              <Heart className="h-4 w-4 mr-2" />
              Caregivers
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Admins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="families">
            <div className="bg-gradient-to-br from-teal-50/60 to-white rounded-2xl p-6 sm:p-8 border border-teal-100/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                  <Home className="h-5 w-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">For Families & Patients</h3>
                  <p className="text-sm text-muted-foreground">
                    Everything you need to find and monitor quality home care
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {familyFeatures.map((f, i) => (
                  <FeatureCard key={i} {...f} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="caregivers">
            <div className="bg-gradient-to-br from-amber-50/60 to-white rounded-2xl p-6 sm:p-8 border border-amber-100/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <Heart className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">For Caregivers & Nurses</h3>
                  <p className="text-sm text-muted-foreground">
                    Access genuine work opportunities and build your professional reputation
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {caregiverFeatures.map((f, i) => (
                  <FeatureCard key={i} {...f} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="admins">
            <div className="bg-gradient-to-br from-rose-50/40 to-white rounded-2xl p-6 sm:p-8 border border-rose-100/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                  <ClipboardList className="h-5 w-5 text-rose-700" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">For Platform Administrators</h3>
                  <p className="text-sm text-muted-foreground">
                    Full visibility and control over the entire care ecosystem
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {adminFeatures.map((f, i) => (
                  <FeatureCard key={i} {...f} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
