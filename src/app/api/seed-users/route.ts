import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const SALT = 10;

export async function GET() {
  try {
    const log: string[] = [];

    // ============ 1. CREATE USERS ============
    const users = [
      { email: "admin@sevasaathi.in", name: "SevaSaathi Admin", phone: "9999999999", password: "Admin@123", role: "ADMIN" as const },
      { email: "family@sevasaathi.in", name: "Rahul Sharma", phone: "9876543210", password: "Family@123", role: "FAMILY" as const },
      { email: "caregiver@sevasaathi.in", name: "Priya Verma", phone: "9876543211", password: "Care@123", role: "CAREGIVER" as const },
      { email: "caregiver2@sevasaathi.in", name: "Amit Patel", phone: "9876543212", password: "Care@123", role: "CAREGIVER" as const },
      { email: "caregiver3@sevasaathi.in", name: "Sunita Kumari", phone: "9876543213", password: "Care@123", role: "CAREGIVER" as const },
    ];

    const userIds: Record<string, string> = {};

    for (const u of users) {
      const existing = await db.user.findUnique({ where: { email: u.email } });
      const hash = await bcrypt.hash(u.password, SALT);
      if (existing) {
        await db.user.update({ where: { id: existing.id }, data: { passwordHash: hash, isActive: true } });
        userIds[u.email] = existing.id;
        log.push(`✅ ${u.email} — updated password`);
        continue;
      }
      const user = await db.user.create({
        data: { email: u.email, name: u.name, phone: u.phone, passwordHash: hash, role: u.role, subscription: "NONE", isActive: true },
      });
      userIds[u.email] = user.id;
      log.push(`✅ ${u.email} — created (${u.role})`);
    }

    const adminId = userIds["admin@sevasaathi.in"];
    const familyId = userIds["family@sevasaathi.in"];
    const caregiver1Id = userIds["caregiver@sevasaathi.in"];
    const caregiver2Id = userIds["caregiver2@sevasaathi.in"];
    const caregiver3Id = userIds["caregiver3@sevasaathi.in"];

    // ============ 2. CAREGIVER PROFILES ============
    const caregivers = [
      {
        userId: caregiver1Id, gender: "FEMALE", dob: "1995-05-15", city: "Mumbai", pincode: "400001",
        address: "Andheri West, Mumbai", rate: 400, exp: 5,
        bio: "Experienced nurse specializing in elderly care, post-surgery recovery, and dementia support.",
        quals: ["BSc Nursing", "First Aid Certified", "CPR Certified"],
        skills: ["Elderly Care", "Post-Surgery Care", "Dementia Care", "Wound Care", "Medication Management"],
        langs: ["Hindi", "English", "Marathi"], rating: 4.8, reviews: 24, jobs: 45,
      },
      {
        userId: caregiver2Id, gender: "MALE", dob: "1990-11-20", city: "Mumbai", pincode: "400051",
        address: "Powai, Mumbai", rate: 350, exp: 3,
        bio: "Compassionate male caregiver with experience in patient mobility and physiotherapy assistance.",
        quals: ["GNM Nursing", "Physiotherapy Assistant"],
        skills: ["Patient Mobility", "Physiotherapy Assistance", "Personal Care", "Companionship"],
        langs: ["Hindi", "English", "Gujarati"], rating: 4.5, reviews: 12, jobs: 20,
      },
      {
        userId: caregiver3Id, gender: "FEMALE", dob: "1988-03-08", city: "Mumbai", pincode: "400068",
        address: "Borivali, Mumbai", rate: 450, exp: 8,
        bio: "Senior caregiver with 8+ years experience in critical care, newborn care, and chronic illness management.",
        quals: ["MSc Nursing", "ICU Trained", "CPR & BLS Certified"],
        skills: ["Critical Care", "Newborn Care", "Chronic Illness", "IV Drip Management", "Vital Monitoring"],
        langs: ["Hindi", "English", "Marathi", "Tamil"], rating: 4.9, reviews: 38, jobs: 72,
      },
    ];

    const caregiverIds: Record<string, string> = {};
    const availability = {
      monday: { available: true, slots: [{ start: "06:00", end: "22:00" }] },
      tuesday: { available: true, slots: [{ start: "06:00", end: "22:00" }] },
      wednesday: { available: true, slots: [{ start: "06:00", end: "22:00" }] },
      thursday: { available: true, slots: [{ start: "06:00", end: "22:00" }] },
      friday: { available: true, slots: [{ start: "06:00", end: "22:00" }] },
      saturday: { available: true, slots: [{ start: "06:00", end: "18:00" }] },
      sunday: { available: false, slots: [] },
    };

    for (const c of caregivers) {
      if (!c.userId) { log.push(`⚠️ Skipping caregiver (no userId)`); continue; }
      const existing = await db.caregiver.findUnique({ where: { userId: c.userId } });
      if (existing) {
        caregiverIds[c.userId] = existing.id;
        log.push(`✅ Caregiver profile (${existing.id.slice(0,6)}...) — exists`);
        continue;
      }
      const cg = await db.caregiver.create({
        data: {
          userId: c.userId, gender: c.gender, dateOfBirth: new Date(c.dob),
          address: c.address, city: c.city, pincode: c.pincode,
          bio: c.bio, yearsExperience: c.exp, hourlyRate: c.rate,
          qualifications: JSON.stringify(c.quals),
          skills: JSON.stringify(c.skills),
          languages: JSON.stringify(c.langs),
          availabilityJson: JSON.stringify(availability),
          isVerified: true, isActive: true,
          overallRating: c.rating, totalReviews: c.reviews, completedJobs: c.jobs,
        },
      });
      caregiverIds[c.userId] = cg.id;
      log.push(`✅ Caregiver profile for ${c.userId.slice(0,8)}... — created`);
    }

    const cg1 = caregiverIds[caregiver1Id];
    const cg2 = caregiverIds[caregiver2Id];
    const cg3 = caregiverIds[caregiver3Id];

    // ============ 3. PATIENT PROFILES ============
    if (familyId) {
      const existingPat = await db.patient.findFirst({ where: { familyId } });
      if (!existingPat) {
        await db.patient.create({
          data: {
            familyId,
            name: "Sunita Sharma",
            age: 72,
            gender: "FEMALE",
            relationship: "mother",
            address: "Flat 302, Green Towers, Andheri West",
            city: "Mumbai",
            pincode: "400058",
            medicalHistory: JSON.stringify(["Diabetes Type 2", "Mild Hypertension", "Knee Pain"]),
            dietaryNeeds: "Low sugar, low salt, soft food preferred",
            mobilityStatus: "limited",
            careRequirements: JSON.stringify({ needsHelpWith: ["bathing", "medication", "cooking", "walking"], specialNotes: "Needs reminder for insulin at 8AM and 8PM" }),
            preferredLanguage: "Hindi",
            emergencyContact: JSON.stringify({ name: "Rahul Sharma", phone: "9876543210", relation: "son" }),
          },
        });
        log.push(`✅ Patient profile (Sunita Sharma) — created`);

        await db.patient.create({
          data: {
            familyId,
            name: "Ramesh Sharma",
            age: 78,
            gender: "MALE",
            relationship: "father",
            address: "Flat 302, Green Towers, Andheri West",
            city: "Mumbai",
            pincode: "400058",
            medicalHistory: JSON.stringify(["Post-bypass surgery", "Arthritis"]),
            dietaryNeeds: "Low oil, high fiber",
            mobilityStatus: "wheelchair",
            careRequirements: JSON.stringify({ needsHelpWith: ["bathing", "feeding", "mobility", "exercises"] }),
            preferredLanguage: "Hindi",
            emergencyContact: JSON.stringify({ name: "Rahul Sharma", phone: "9876543210", relation: "son" }),
          },
        });
        log.push(`✅ Patient profile (Ramesh Sharma) — created`);
      } else {
        log.push(`✅ Patient profiles — already exist`);
      }
    }

    // ============ 4. BOOKINGS ============
    const patients = await db.patient.findMany({ where: { familyId } });
    const pat1 = patients[0]?.id;
    const pat2 = patients[1]?.id;

    if (pat1 && cg1) {
      const existingBooking = await db.booking.findFirst({ where: { patientId: pat1, caregiverId: cg1 } });
      if (!existingBooking) {
        const b1 = await db.booking.create({
          data: {
            patientId: pat1, caregiverId: cg1, familyId: familyId!,
            shiftType: "DAY_SHIFT",
            startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            startTime: "08:00", endTime: "20:00",
            careRequirements: JSON.stringify({ type: "elderly-care", priority: "medium" }),
            status: "IN_PROGRESS",
            familyNotes: "Please be patient and gentle with mother.",
            totalAmount: 12000, platformFee: 1200,
          },
        });
        log.push(`✅ Booking (IN_PROGRESS, Priya→Sunita) — created`);

        // Payment for completed status
        await db.payment.create({
          data: {
            bookingId: b1.id, familyId: familyId!, caregiverId: cg1,
            amount: 1200000, platformFee: 120000, caregiverPayout: 1080000,
            status: "PENDING", paymentMethod: "upi",
          },
        });
        log.push(`✅ Payment for booking — created`);

        // Care report
        await db.careReport.create({
          data: {
            bookingId: b1.id, caregiverId: cg1,
            reportDate: new Date().toISOString().split("T")[0],
            activities: JSON.stringify([
              { type: "FEEDING", time: "08:30", note: "Had poha and tea" },
              { type: "MEDICINE", time: "08:00", note: "Insulin taken on time" },
              { type: "EXERCISE", time: "10:00", note: "15 min light stretching" },
              { type: "FEEDING", time: "13:00", note: "Had dal rice and sabzi" },
              { type: "COMPANIONSHIP", time: "15:00", note: "Watched TV together, talked about family" },
            ]),
            summary: "Good day overall. Patient was cheerful and cooperative. All meals taken on time. Morning walk completed.",
            mood: "good",
            foodIntake: "good",
            medicinesGiven: JSON.stringify([
              { name: "Insulin", time: "08:00", given: true },
              { name: "Metformin", time: "08:00", given: true },
              { name: "Amlodipine", time: "09:00", given: true },
              { name: "Metformin", time: "20:00", given: false },
            ]),
          },
        });
        log.push(`✅ Care report — created`);
      } else {
        log.push(`✅ Bookings — already exist`);
      }
    }

    // Second booking - COMPLETED
    if (pat1 && cg3) {
      const exB2 = await db.booking.findFirst({ where: { patientId: pat1, caregiverId: cg3 } });
      if (!exB2) {
        const b2 = await db.booking.create({
          data: {
            patientId: pat1, caregiverId: cg3, familyId: familyId!,
            shiftType: "TWELVE_HOUR",
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            startTime: "08:00", endTime: "20:00",
            careRequirements: JSON.stringify({ type: "post-surgery" }),
            status: "COMPLETED",
            totalAmount: 24000, platformFee: 2400,
          },
        });
        await db.payment.create({
          data: {
            bookingId: b2.id, familyId: familyId!, caregiverId: cg3,
            amount: 2400000, platformFee: 240000, caregiverPayout: 2160000,
            status: "COMPLETED", paymentMethod: "upi", paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
        });
        await db.review.create({
          data: {
            bookingId: b2.id, familyId: familyId!, caregiverId: cg3,
            rating: 5, communicationRating: 5, punctualityRating: 5, careQualityRating: 5,
            comment: "Sunita ji was extremely caring and professional. Highly recommend!",
          },
        });
        log.push(`✅ Completed booking + payment + review — created`);
      }
    }

    // ============ 5. NOTIFICATIONS ============
    if (familyId) {
      const notifCount = await db.notification.count({ where: { userId: familyId } });
      if (notifCount === 0) {
        await db.notification.createMany({
          data: [
            { userId: familyId, type: "BOOKING_CONFIRMED", title: "Booking Confirmed", message: "Your booking with Priya Verma has been confirmed.", isRead: true },
            { userId: familyId, type: "CARE_REPORT_SUBMITTED", title: "New Care Report", message: "Priya submitted today's care report for Sunita Sharma.", isRead: false },
            { userId: familyId, type: "PAYMENT_RECEIVED", title: "Payment Pending", message: "Payment of ₹1,200 is pending for your active booking.", isRead: false },
          ],
        });
        log.push(`✅ Notifications — created`);
      }
    }

    // ============ 6. VERIFICATION DOCS ============
    if (cg1 && adminId) {
      const vCount = await db.verification.count({ where: { caregiverId: cg1 } });
      if (vCount === 0) {
        await db.verification.createMany({
          data: [
            { caregiverId: cg1, docType: "AADHAAR", docNumber: "XXXX-XXXX-1234", docUrl: "/uploads/aadhaar.jpg", status: "APPROVED", reviewedBy: adminId, reviewedAt: new Date() },
            { caregiverId: cg1, docType: "NURSING_CERTIFICATE", docNumber: "NUR-2020-4567", docUrl: "/uploads/nursing.jpg", status: "APPROVED", reviewedBy: adminId, reviewedAt: new Date() },
          ],
        });
        log.push(`✅ Verification docs for Priya — created`);
      }
    }

    return NextResponse.json({
      message: "Database seeded successfully!",
      log,
      logins: {
        admin:    { email: "admin@sevasaathi.in",    password: "Admin@123" },
        family:   { email: "family@sevasaathi.in",   password: "Family@123" },
        caregiver: { email: "caregiver@sevasaathi.in", password: "Care@123" },
        caregiver2: { email: "caregiver2@sevasaathi.in", password: "Care@123" },
        caregiver3: { email: "caregiver3@sevasaathi.in", password: "Care@123" },
      },
    });
  } catch (err: any) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: err.message, stack: err.stack?.split("\n").slice(0, 5) }, { status: 500 });
  }
}
