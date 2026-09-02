import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const TEST_ACCOUNTS = [
  {
    email: "admin@sevasaathi.in",
    name: "SevaSaathi Admin",
    phone: "9999999999",
    password: "Admin@123",
    role: "ADMIN" as const,
  },
  {
    email: "family@sevasaathi.in",
    name: "Rahul Sharma",
    phone: "9876543210",
    password: "Family@123",
    role: "FAMILY" as const,
  },
  {
    email: "caregiver@sevasaathi.in",
    name: "Priya Verma",
    phone: "9876543211",
    password: "Care@123",
    role: "CAREGIVER" as const,
  },
];

export async function GET() {
  try {
    const results: { email: string; status: string }[] = [];

    for (const acc of TEST_ACCOUNTS) {
      const existing = await db.user.findUnique({ where: { email: acc.email } });
      if (existing) {
        results.push({ email: acc.email, status: "already exists" });
        continue;
      }

      const passwordHash = await bcrypt.hash(acc.password, SALT_ROUNDS);
      await db.user.create({
        data: {
          email: acc.email,
          name: acc.name,
          phone: acc.phone,
          passwordHash,
          role: acc.role,
          subscription: "NONE",
          isActive: true,
        },
      });
      results.push({ email: acc.email, status: "created" });
    }

    // Create caregiver profile for the caregiver account
    const caregiver = await db.user.findUnique({ where: { email: "caregiver@sevasaathi.in" } });
    if (caregiver && !caregiver.caregiverProfile) {
      await db.caregiver.create({
        data: {
          userId: caregiver.id,
          gender: "FEMALE",
          dateOfBirth: new Date("1995-05-15"),
          address: "Mumbai, Maharashtra",
          city: "Mumbai",
          pincode: "400001",
          bio: "Experienced caregiver specializing in elderly care and post-surgery recovery.",
          yearsExperience: 5,
          qualifications: JSON.stringify(["BSc Nursing", "First Aid Certified"]),
          hourlyRate: 350,
          skills: JSON.stringify(["Elderly Care", "Post-Surgery Care", "Personal Care", "Meal Preparation"]),
          languages: JSON.stringify(["Hindi", "English", "Marathi"]),
          availabilityJson: JSON.stringify({
            monday: { available: true, slots: [{ start: "08:00", end: "20:00" }] },
            tuesday: { available: true, slots: [{ start: "08:00", end: "20:00" }] },
            wednesday: { available: true, slots: [{ start: "08:00", end: "20:00" }] },
            thursday: { available: true, slots: [{ start: "08:00", end: "20:00" }] },
            friday: { available: true, slots: [{ start: "08:00", end: "20:00" }] },
            saturday: { available: true, slots: [{ start: "08:00", end: "18:00" }] },
            sunday: { available: false, slots: [] },
          }),
          isVerified: true,
          overallRating: 4.8,
          totalReviews: 24,
          completedJobs: 45,
        },
      });
      results.push({ email: "caregiver@sevasaathi.in", status: "+ caregiver profile created" });
    }

    return NextResponse.json({
      message: "Seed complete",
      accounts: results,
      logins: {
        admin: { email: "admin@sevasaathi.in", password: "Admin@123" },
        family: { email: "family@sevasaathi.in", password: "Family@123" },
        caregiver: { email: "caregiver@sevasaathi.in", password: "Care@123" },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
