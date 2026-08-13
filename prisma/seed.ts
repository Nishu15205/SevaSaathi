import { PrismaClient, UserRole, VerificationType, VerificationStatus, BookingStatus, ShiftType, ComplaintStatus, NotificationType, SubscriptionPlan, PaymentStatus, CareActivityType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const SALT_ROUNDS = 10
const PASSWORD = 'password123'

async function hashPassword(): Promise<string> {
  return bcrypt.hash(PASSWORD, SALT_ROUNDS)
}

async function main() {
  console.log('🌱 Seeding SevaSaathi database...')

  // Clean existing data
  await db.notification.deleteMany()
  await db.complaint.deleteMany()
  await db.review.deleteMany()
  await db.careReport.deleteMany()
  await db.payment.deleteMany()
  await db.booking.deleteMany()
  await db.verification.deleteMany()
  await db.patient.deleteMany()
  await db.caregiver.deleteMany()
  await db.user.deleteMany()

  const passwordHash = await hashPassword()

  // ========================================
  // 1. Admin Users (3)
  // ========================================
  const admins = await Promise.all([
    db.user.create({
      data: {
        email: 'admin@sevasaathi.in',
        passwordHash,
        phone: '+919876543210',
        name: 'Rajesh Kumar Sharma',
        role: UserRole.ADMIN,
        subscription: SubscriptionPlan.ENTERPRISE,
        isActive: true,
      },
    }),
    db.user.create({
      data: {
        email: 'operations@sevasaathi.in',
        passwordHash,
        phone: '+919876543211',
        name: 'Priya Verma',
        role: UserRole.ADMIN,
        subscription: SubscriptionPlan.ENTERPRISE,
        isActive: true,
      },
    }),
    db.user.create({
      data: {
        email: 'support@sevasaathi.in',
        passwordHash,
        phone: '+919876543212',
        name: 'Amit Mehta',
        role: UserRole.ADMIN,
        subscription: SubscriptionPlan.ENTERPRISE,
        isActive: true,
      },
    }),
  ])

  // ========================================
  // 2. Family Users with Patient Profiles (5)
  // ========================================
  const families = await Promise.all([
    db.user.create({
      data: {
        email: 'anita.gupta@email.com',
        passwordHash,
        phone: '+919811122233',
        name: 'Anita Gupta',
        role: UserRole.FAMILY,
        subscription: SubscriptionPlan.PREMIUM,
        isActive: true,
        patientProfiles: {
          create: {
            name: 'Shanti Devi',
            age: 78,
            gender: 'Female',
            relationship: 'Mother',
            address: 'Flat 302, Antriksh Apartments, Janakpuri',
            city: 'Delhi',
            pincode: '110058',
            medicalHistory: JSON.stringify([
              { condition: 'Diabetes Type 2', since: '2010', medication: 'Metformin 500mg' },
              { condition: 'Hypertension', since: '2015', medication: 'Amlodipine 5mg' },
              { condition: 'Mild Osteoarthritis', since: '2018', medication: 'Calcium + Vitamin D' },
            ]),
            dietaryNeeds: 'Low sugar, low salt, soft food preferred',
            mobilityStatus: 'limited',
            careRequirements: JSON.stringify({
              primaryNeeds: ['feeding', 'mobility-support', 'medicine-management'],
              specialInstructions: 'Needs help with walking, blood sugar monitoring twice daily',
              hoursPerDay: 12,
            }),
            preferredLanguage: 'Hindi',
            emergencyContact: JSON.stringify({ name: 'Vikram Gupta', phone: '+919911122233', relation: 'Son' }),
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'suresh.patel@email.com',
        passwordHash,
        phone: '+919822233344',
        name: 'Suresh Patel',
        role: UserRole.FAMILY,
        subscription: SubscriptionPlan.BASIC,
        isActive: true,
        patientProfiles: {
          create: {
            name: 'Ramesh Patel',
            age: 82,
            gender: 'Male',
            relationship: 'Father',
            address: 'H.No. 45, Sector 15, Dwarka',
            city: 'Delhi',
            pincode: '110075',
            medicalHistory: JSON.stringify([
              { condition: 'Post CABG surgery', since: '2023', medication: 'Aspirin, Atorvastatin' },
              { condition: 'Chronic Kidney Disease Stage 3', since: '2022', medication: 'Losartan' },
            ]),
            dietaryNeeds: 'Renal diet, low potassium, moderate protein',
            mobilityStatus: 'limited',
            careRequirements: JSON.stringify({
              primaryNeeds: ['medicine-management', 'post-surgery-care', 'mobility-support'],
              specialInstructions: 'Monitor BP and weight daily, wound care for surgical site',
              hoursPerDay: 24,
            }),
            preferredLanguage: 'Gujarati, Hindi',
            emergencyContact: JSON.stringify({ name: 'Suresh Patel', phone: '+919822233344', relation: 'Son' }),
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'meena.reddy@email.com',
        passwordHash,
        phone: '+919833344455',
        name: 'Meena Reddy',
        role: UserRole.FAMILY,
        subscription: SubscriptionPlan.PREMIUM,
        isActive: true,
        patientProfiles: {
          create: {
            name: 'Lakshmi Reddy',
            age: 85,
            gender: 'Female',
            relationship: 'Mother-in-law',
            address: 'Plot 12, Sector 62, Noida',
            city: 'Noida',
            pincode: '201309',
            medicalHistory: JSON.stringify([
              { condition: 'Alzheimers (early stage)', since: '2021', medication: 'Donepezil 10mg' },
              { condition: 'Osteoporosis', since: '2016', medication: 'Alendronate' },
            ]),
            dietaryNeeds: 'Calcium rich, easy to chew, South Indian preferred',
            mobilityStatus: 'mobile',
            careRequirements: JSON.stringify({
              primaryNeeds: ['dementia-care', 'elderly-companionship', 'feeding', 'medicine-management'],
              specialInstructions: 'Needs supervision, may wander, remind for meals and medicines',
              hoursPerDay: 12,
            }),
            preferredLanguage: 'Telugu, Hindi',
            emergencyContact: JSON.stringify({ name: 'Rajesh Reddy', phone: '+919933344455', relation: 'Son' }),
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'deepak.singh@email.com',
        passwordHash,
        phone: '+919844455566',
        name: 'Deepak Singh',
        role: UserRole.FAMILY,
        subscription: SubscriptionPlan.BASIC,
        isActive: true,
        patientProfiles: {
          create: {
            name: 'Harjeet Singh',
            age: 75,
            gender: 'Male',
            relationship: 'Father',
            address: 'House 78, Block B, Rohini Sector 7',
            city: 'Delhi',
            pincode: '110085',
            medicalHistory: JSON.stringify([
              { condition: 'Parkinsons Disease', since: '2019', medication: 'Levodopa, Carbidopa' },
              { condition: 'BPH', since: '2020', medication: 'Tamsulosin' },
            ]),
            dietaryNeeds: 'High fiber, regular meals on time',
            mobilityStatus: 'wheelchair',
            careRequirements: JSON.stringify({
              primaryNeeds: ['mobility-support', 'feeding', 'physiotherapy-assist', 'medicine-management'],
              specialInstructions: 'Help with exercises, assist in transfers, patience with tremors',
              hoursPerDay: 24,
            }),
            preferredLanguage: 'Punjabi, Hindi',
            emergencyContact: JSON.stringify({ name: 'Deepak Singh', phone: '+919844455566', relation: 'Son' }),
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'pooja.kapoor@email.com',
        passwordHash,
        phone: '+919855566677',
        name: 'Pooja Kapoor',
        role: UserRole.FAMILY,
        subscription: SubscriptionPlan.PREMIUM,
        isActive: true,
        patientProfiles: {
          create: {
            name: 'Kamal Kapoor',
            age: 71,
            gender: 'Male',
            relationship: 'Father',
            address: 'Flat 1501, DLF Phase 3, Gurgaon',
            city: 'Gurgaon',
            pincode: '122002',
            medicalHistory: JSON.stringify([
              { condition: 'Diabetic neuropathy', since: '2017', medication: 'Pregabalin, Insulin' },
              { condition: 'Mild stroke (left side affected)', since: '2024', medication: 'Clopidogrel' },
            ]),
            dietaryNeeds: 'Diabetic diet, small frequent meals',
            mobilityStatus: 'bedridden',
            careRequirements: JSON.stringify({
              primaryNeeds: ['bedridden-care', 'feeding', 'wound-care', 'physiotherapy-assist', 'medicine-management'],
              specialInstructions: 'Bed sores prevention, passive exercises, insulin injection at 8AM and 8PM',
              hoursPerDay: 24,
            }),
            preferredLanguage: 'Hindi, English',
            emergencyContact: JSON.stringify({ name: 'Pooja Kapoor', phone: '+919855566677', relation: 'Daughter' }),
          },
        },
      },
    }),
  ])

  // ========================================
  // 3. Caregiver Users with Profiles (8)
  // ========================================
  const defaultAvailability = JSON.stringify({
    mon: { day: true, night: true },
    tue: { day: true, night: true },
    wed: { day: true, night: true },
    thu: { day: true, night: true },
    fri: { day: true, night: true },
    sat: { day: true, night: false },
    sun: { day: true, night: false },
  })

  const caregiverUsers = await Promise.all([
    db.user.create({
      data: {
        email: 'sunita.care@email.com',
        passwordHash,
        phone: '+917666111222',
        name: 'Sunita Devi',
        role: UserRole.CAREGIVER,
        subscription: SubscriptionPlan.NONE,
        isActive: true,
        caregiverProfile: {
          create: {
            gender: 'Female',
            dateOfBirth: new Date('1985-03-15'),
            address: 'Jhuggi 14, Madanpur Khadar',
            city: 'Delhi',
            pincode: '110076',
            latitude: 28.5355,
            longitude: 77.2726,
            yearsExperience: 8,
            qualifications: JSON.stringify(['ANM Nursing', 'First Aid Certified', 'Bedside Care Training']),
            skills: JSON.stringify(['bedridden-care', 'feeding', 'wound-care', 'medicine-management', 'elderly-companionship', 'hygiene-care']),
            languages: JSON.stringify(['Hindi', 'Bhojpuri']),
            bio: 'Experienced caregiver specializing in elderly and bedridden patient care. Trained in wound management and medicine administration.',
            hourlyRate: 250,
            availabilityJson: defaultAvailability,
            overallRating: 4.7,
            totalReviews: 34,
            completedJobs: 52,
            isVerified: true,
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'rajendra.care@email.com',
        passwordHash,
        phone: '+917666333444',
        name: 'Rajendra Kumar',
        role: UserRole.CAREGIVER,
        subscription: SubscriptionPlan.NONE,
        isActive: true,
        caregiverProfile: {
          create: {
            gender: 'Male',
            dateOfBirth: new Date('1980-07-22'),
            address: 'House 201, Sector 8, Dwarka',
            city: 'Delhi',
            pincode: '110077',
            latitude: 28.5733,
            longitude: 77.0428,
            yearsExperience: 12,
            qualifications: JSON.stringify(['BSc Nursing', 'Physiotherapy Assistant Diploma', 'BLS Certified']),
            skills: JSON.stringify(['physiotherapy-assist', 'mobility-support', 'post-surgery-care', 'bedridden-care', 'medicine-management']),
            languages: JSON.stringify(['Hindi', 'English', 'Punjabi']),
            bio: 'Male nurse with 12 years experience in post-surgical and physiotherapy care. Strong background in patient mobility and rehabilitation support.',
            hourlyRate: 350,
            availabilityJson: defaultAvailability,
            overallRating: 4.9,
            totalReviews: 67,
            completedJobs: 120,
            isVerified: true,
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'geeta.nurse@email.com',
        passwordHash,
        phone: '+917666555666',
        name: 'Geeta Rani',
        role: UserRole.CAREGIVER,
        subscription: SubscriptionPlan.NONE,
        isActive: true,
        caregiverProfile: {
          create: {
            gender: 'Female',
            dateOfBirth: new Date('1990-11-08'),
            address: 'Flat 5B, Sector 12, Noida',
            city: 'Noida',
            pincode: '201301',
            latitude: 28.5355,
            longitude: 77.3910,
            yearsExperience: 5,
            qualifications: JSON.stringify(['GNM Nursing', 'Dementia Care Certified']),
            skills: JSON.stringify(['dementia-care', 'elderly-companionship', 'feeding', 'medicine-management', 'mobility-support']),
            languages: JSON.stringify(['Hindi', 'English']),
            bio: 'Compassionate nurse trained in dementia and elderly care. Excellent communication skills and patience with elderly patients.',
            hourlyRate: 300,
            availabilityJson: defaultAvailability,
            overallRating: 4.5,
            totalReviews: 22,
            completedJobs: 35,
            isVerified: true,
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'mohan.pal@email.com',
        passwordHash,
        phone: '+917666777888',
        name: 'Mohan Pal',
        role: UserRole.CAREGIVER,
        subscription: SubscriptionPlan.NONE,
        isActive: true,
        caregiverProfile: {
          create: {
            gender: 'Male',
            dateOfBirth: new Date('1988-01-30'),
            address: 'Village Bamnoli, Near Sector 28',
            city: 'Gurgaon',
            pincode: '122001',
            latitude: 28.4595,
            longitude: 77.0266,
            yearsExperience: 6,
            qualifications: JSON.stringify(['ANM Nursing', 'Home Nursing Certificate']),
            skills: JSON.stringify(['bedridden-care', 'feeding', 'mobility-support', 'wound-care', 'medicine-management']),
            languages: JSON.stringify(['Hindi', 'Haryanvi']),
            bio: 'Dedicated male caregiver experienced in handling bedridden patients. Strong and caring, specializes in patient transfer and mobility.',
            hourlyRate: 280,
            availabilityJson: defaultAvailability,
            overallRating: 4.3,
            totalReviews: 18,
            completedJobs: 28,
            isVerified: false,
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'kamla.bai@email.com',
        passwordHash,
        phone: '+917666999000',
        name: 'Kamla Bai',
        role: UserRole.CAREGIVER,
        subscription: SubscriptionPlan.NONE,
        isActive: true,
        caregiverProfile: {
          create: {
            gender: 'Female',
            dateOfBirth: new Date('1982-06-12'),
            address: 'House 89, JJ Colony, Bawana',
            city: 'Delhi',
            pincode: '110039',
            latitude: 28.7766,
            longitude: 77.0513,
            yearsExperience: 10,
            qualifications: JSON.stringify(['GNM Nursing', 'Wound Care Specialist Certificate', 'Diabetes Educator']),
            skills: JSON.stringify(['wound-care', 'bedridden-care', 'feeding', 'medicine-management', 'physiotherapy-assist', 'post-surgery-care']),
            languages: JSON.stringify(['Hindi', 'Rajasthani']),
            bio: 'Highly experienced wound care specialist nurse. 10 years of dedicated service in home healthcare, particularly with diabetic patients.',
            hourlyRate: 320,
            availabilityJson: defaultAvailability,
            overallRating: 4.8,
            totalReviews: 45,
            completedJobs: 78,
            isVerified: true,
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'naveen.attendant@email.com',
        passwordHash,
        phone: '+917777111222',
        name: 'Naveen Chauhan',
        role: UserRole.CAREGIVER,
        subscription: SubscriptionPlan.NONE,
        isActive: true,
        caregiverProfile: {
          create: {
            gender: 'Male',
            dateOfBirth: new Date('1995-09-03'),
            address: 'Room 12, PG Block, Pitampura',
            city: 'Delhi',
            pincode: '110034',
            latitude: 28.6996,
            longitude: 77.1425,
            yearsExperience: 2,
            qualifications: JSON.stringify(['Home Care Attendant Course', 'First Aid']),
            skills: JSON.stringify(['elderly-companionship', 'feeding', 'mobility-support', 'medicine-management']),
            languages: JSON.stringify(['Hindi', 'English']),
            bio: 'Young and energetic caregiver. Good at building rapport with elderly patients. Trained in basic patient care and first aid.',
            hourlyRate: 200,
            availabilityJson: defaultAvailability,
            overallRating: 4.0,
            totalReviews: 8,
            completedJobs: 12,
            isVerified: false,
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'prabha.devi@email.com',
        passwordHash,
        phone: '+917777333444',
        name: 'Prabha Devi',
        role: UserRole.CAREGIVER,
        subscription: SubscriptionPlan.NONE,
        isActive: true,
        caregiverProfile: {
          create: {
            gender: 'Female',
            dateOfBirth: new Date('1987-12-25'),
            address: 'Flat 3A, Sector 56, Noida',
            city: 'Noida',
            pincode: '201301',
            latitude: 28.5766,
            longitude: 77.3211,
            yearsExperience: 7,
            qualifications: JSON.stringify(['ANM Nursing', 'Post-Surgery Care Training', 'CPR Certified']),
            skills: JSON.stringify(['post-surgery-care', 'wound-care', 'feeding', 'bedridden-care', 'medicine-management', 'physiotherapy-assist']),
            languages: JSON.stringify(['Hindi', 'English', 'Bengali']),
            bio: 'Specialized in post-surgery home care. Certified in CPR and wound management. Known for meticulous attention to patient recovery protocols.',
            hourlyRate: 330,
            availabilityJson: defaultAvailability,
            overallRating: 4.6,
            totalReviews: 29,
            completedJobs: 42,
            isVerified: true,
          },
        },
      },
    }),
    db.user.create({
      data: {
        email: 'satish.kumar@email.com',
        passwordHash,
        phone: '+917777555666',
        name: 'Satish Kumar',
        role: UserRole.CAREGIVER,
        subscription: SubscriptionPlan.NONE,
        isActive: true,
        caregiverProfile: {
          create: {
            gender: 'Male',
            dateOfBirth: new Date('1983-04-18'),
            address: 'D-12, Sector 37, Gurgaon',
            city: 'Gurgaon',
            pincode: '122001',
            latitude: 28.4495,
            longitude: 77.0636,
            yearsExperience: 9,
            qualifications: JSON.stringify(['BSc Nursing', 'ICU Experience', 'Geriatric Care Certificate']),
            skills: JSON.stringify(['bedridden-care', 'medicine-management', 'wound-care', 'feeding', 'mobility-support', 'physiotherapy-assist', 'dementia-care', 'elderly-companionship']),
            languages: JSON.stringify(['Hindi', 'English', 'Tamil']),
            bio: 'Versatile nurse with ICU background and geriatric care specialization. Can handle complex medical needs including ventilator-assisted patients.',
            hourlyRate: 380,
            availabilityJson: defaultAvailability,
            overallRating: 4.9,
            totalReviews: 55,
            completedJobs: 95,
            isVerified: true,
          },
        },
      },
    }),
  ])

  const caregiverUsersWithProfile = await db.user.findMany({
    where: { role: UserRole.CAREGIVER },
    include: { caregiverProfile: true },
    orderBy: { createdAt: 'asc' },
  })
  const caregivers = caregiverUsersWithProfile.map((u) => u.caregiverProfile!)

  // Also get family users with patients for reference
  const familyUsersWithPatients = await db.user.findMany({
    where: { role: UserRole.FAMILY },
    include: { patientProfiles: true },
    orderBy: { createdAt: 'asc' },
  })

  // ========================================
  // 4. Verification Documents
  // ========================================
  const caregiver0 = caregivers[0] // Sunita - verified
  const caregiver1 = caregivers[1] // Rajendra - verified
  const caregiver2 = caregivers[2] // Geeta - verified
  const caregiver3 = caregivers[3] // Mohan - unverified (pending docs)
  const caregiver4 = caregivers[4] // Kamla - verified
  const caregiver5 = caregivers[5] // Naveen - unverified
  const caregiver6 = caregivers[6] // Prabha - verified
  const caregiver7 = caregivers[7] // Satish - verified

  await db.verification.createMany({
    data: [
      // Sunita - all approved
      { caregiverId: caregiver0.id, docType: VerificationType.AADHAAR, docNumber: '1234-5678-9012', docUrl: '/docs/sunita-aadhaar.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-11-10') },
      { caregiverId: caregiver0.id, docType: VerificationType.NURSING_CERTIFICATE, docNumber: 'ANM-2017-0456', docUrl: '/docs/sunita-nursing.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-11-10') },
      { caregiverId: caregiver0.id, docType: VerificationType.POLICE_VERIFICATION, docNumber: 'PV-DL-2024-089', docUrl: '/docs/sunita-police.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-11-12') },
      // Rajendra - all approved
      { caregiverId: caregiver1.id, docType: VerificationType.AADHAAR, docNumber: '2345-6789-0123', docUrl: '/docs/rajendra-aadhaar.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[1].id, reviewedAt: new Date('2024-10-15') },
      { caregiverId: caregiver1.id, docType: VerificationType.MEDICAL_DEGREE, docNumber: 'BScN-2012-1234', docUrl: '/docs/rajendra-degree.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[1].id, reviewedAt: new Date('2024-10-15') },
      { caregiverId: caregiver1.id, docType: VerificationType.POLICE_VERIFICATION, docNumber: 'PV-DL-2024-045', docUrl: '/docs/rajendra-police.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[1].id, reviewedAt: new Date('2024-10-17') },
      // Geeta - all approved
      { caregiverId: caregiver2.id, docType: VerificationType.AADHAAR, docNumber: '3456-7890-1234', docUrl: '/docs/geeta-aadhaar.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-12-01') },
      { caregiverId: caregiver2.id, docType: VerificationType.NURSING_CERTIFICATE, docNumber: 'GNM-2018-0789', docUrl: '/docs/geeta-nursing.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-12-01') },
      // Mohan - pending + rejected
      { caregiverId: caregiver3.id, docType: VerificationType.AADHAAR, docNumber: '4567-8901-2345', docUrl: '/docs/mohan-aadhaar.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[1].id, reviewedAt: new Date('2025-01-05') },
      { caregiverId: caregiver3.id, docType: VerificationType.NURSING_CERTIFICATE, docNumber: 'ANM-2020-0321', docUrl: '/docs/mohan-nursing.pdf', status: VerificationStatus.REJECTED, reviewedBy: admins[1].id, reviewedAt: new Date('2025-01-06'), rejectionReason: 'Certificate is partially visible. Please re-upload a clear scan.' },
      { caregiverId: caregiver3.id, docType: VerificationType.POLICE_VERIFICATION, docNumber: 'PV-HR-2025-012', docUrl: '/docs/mohan-police.pdf', status: VerificationStatus.PENDING },
      // Kamla - approved
      { caregiverId: caregiver4.id, docType: VerificationType.AADHAAR, docNumber: '5678-9012-3456', docUrl: '/docs/kamla-aadhaar.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-09-20') },
      { caregiverId: caregiver4.id, docType: VerificationType.NURSING_CERTIFICATE, docNumber: 'GNM-2014-0567', docUrl: '/docs/kamla-nursing.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-09-20') },
      { caregiverId: caregiver4.id, docType: VerificationType.POLICE_VERIFICATION, docNumber: 'PV-DL-2024-023', docUrl: '/docs/kamla-police.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-09-22') },
      // Naveen - pending
      { caregiverId: caregiver5.id, docType: VerificationType.AADHAAR, docNumber: '6789-0123-4567', docUrl: '/docs/naveen-aadhaar.pdf', status: VerificationStatus.PENDING },
      { caregiverId: caregiver5.id, docType: VerificationType.ADDRESS_PROOF, docNumber: 'PASSPORT-M7890123', docUrl: '/docs/naveen-address.pdf', status: VerificationStatus.PENDING },
      // Prabha - approved
      { caregiverId: caregiver6.id, docType: VerificationType.AADHAAR, docNumber: '7890-1234-5678', docUrl: '/docs/prabha-aadhaar.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[2].id, reviewedAt: new Date('2024-11-25') },
      { caregiverId: caregiver6.id, docType: VerificationType.NURSING_CERTIFICATE, docNumber: 'ANM-2017-0901', docUrl: '/docs/prabha-nursing.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[2].id, reviewedAt: new Date('2024-11-25') },
      { caregiverId: caregiver6.id, docType: VerificationType.POLICE_VERIFICATION, docNumber: 'PV-UP-2024-156', docUrl: '/docs/prabha-police.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[2].id, reviewedAt: new Date('2024-11-27') },
      // Satish - approved
      { caregiverId: caregiver7.id, docType: VerificationType.AADHAAR, docNumber: '8901-2345-6789', docUrl: '/docs/satish-aadhaar.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-08-10') },
      { caregiverId: caregiver7.id, docType: VerificationType.MEDICAL_DEGREE, docNumber: 'BScN-2011-0432', docUrl: '/docs/satish-degree.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-08-10') },
      { caregiverId: caregiver7.id, docType: VerificationType.POLICE_VERIFICATION, docNumber: 'PV-HR-2024-178', docUrl: '/docs/satish-police.pdf', status: VerificationStatus.APPROVED, reviewedBy: admins[0].id, reviewedAt: new Date('2024-08-12') },
    ],
  })

  // ========================================
  // 5. Bookings (10)
  // ========================================
  const patients = await db.patient.findMany({ where: { familyId: { in: families.map((f) => f.id) } } })

  const bookingsData = [
    { patientId: patients[0].id, caregiverId: caregivers[0].id, familyId: families[0].id, shiftType: ShiftType.TWELVE_HOUR, startDate: new Date('2025-06-01'), endDate: new Date('2025-06-15'), startTime: '08:00', endTime: '20:00', status: BookingStatus.COMPLETED, totalAmount: 42000, platformFee: 4200, careRequirements: JSON.stringify({ needs: ['feeding', 'mobility-support', 'medicine-management'] }), familyNotes: 'Mother needs gentle and patient care. She speaks Hindi only.' },
    { patientId: patients[1].id, caregiverId: caregivers[1].id, familyId: families[1].id, shiftType: ShiftType.TWENTY_FOUR_HOUR, startDate: new Date('2025-06-10'), endDate: new Date('2025-06-20'), startTime: '00:00', endTime: '23:59', status: BookingStatus.COMPLETED, totalAmount: 84000, platformFee: 8400, careRequirements: JSON.stringify({ needs: ['medicine-management', 'post-surgery-care', 'mobility-support'] }), familyNotes: 'Father had bypass surgery. Strict dietary restrictions.' },
    { patientId: patients[2].id, caregiverId: caregivers[2].id, familyId: families[2].id, shiftType: ShiftType.DAY_SHIFT, startDate: new Date('2025-07-01'), endDate: new Date('2025-07-31'), startTime: '08:00', endTime: '20:00', status: BookingStatus.COMPLETED, totalAmount: 108000, platformFee: 10800, careRequirements: JSON.stringify({ needs: ['dementia-care', 'elderly-companionship', 'feeding', 'medicine-management'] }), familyNotes: 'Mother-in-law tends to forget meals. Needs reminders and companionship.' },
    { patientId: patients[3].id, caregiverId: caregivers[4].id, familyId: families[3].id, shiftType: ShiftType.TWENTY_FOUR_HOUR, startDate: new Date('2025-07-05'), endDate: new Date('2025-07-20'), startTime: '00:00', endTime: '23:59', status: BookingStatus.COMPLETED, totalAmount: 76800, platformFee: 7680, careRequirements: JSON.stringify({ needs: ['bedridden-care', 'feeding', 'wound-care', 'physiotherapy-assist', 'medicine-management'] }), familyNotes: 'Father is diabetic with bed sores. Wound dressing twice daily.' },
    { patientId: patients[4].id, caregiverId: caregivers[7].id, familyId: families[4].id, shiftType: ShiftType.TWENTY_FOUR_HOUR, startDate: new Date('2025-07-10'), endDate: null, startTime: '00:00', endTime: '23:59', status: BookingStatus.COMPLETED, totalAmount: 91200, platformFee: 9120, careRequirements: JSON.stringify({ needs: ['bedridden-care', 'feeding', 'wound-care', 'physiotherapy-assist', 'medicine-management'] }), familyNotes: 'Father had a stroke. Left side affected. Needs complete care.' },
    { patientId: patients[0].id, caregiverId: caregivers[6].id, familyId: families[0].id, shiftType: ShiftType.TWELVE_HOUR, startDate: new Date('2025-07-20'), endDate: new Date('2025-08-05'), startTime: '08:00', endTime: '20:00', status: BookingStatus.CONFIRMED, totalAmount: 52800, platformFee: 5280, careRequirements: JSON.stringify({ needs: ['post-surgery-care', 'wound-care', 'feeding', 'medicine-management'] }), familyNotes: 'Mother has a small surgery scheduled. Need post-op care.' },
    { patientId: patients[1].id, caregiverId: caregivers[4].id, familyId: families[1].id, shiftType: ShiftType.TWENTY_FOUR_HOUR, startDate: new Date('2025-07-25'), endDate: new Date('2025-08-10'), startTime: '00:00', endTime: '23:59', status: BookingStatus.PENDING, totalAmount: 76800, platformFee: 7680, careRequirements: JSON.stringify({ needs: ['bedridden-care', 'feeding', 'wound-care', 'medicine-management'] }), familyNotes: 'Continuing care for father after previous caregiver.' },
    { patientId: patients[3].id, caregiverId: caregivers[1].id, familyId: families[3].id, shiftType: ShiftType.TWELVE_HOUR, startDate: new Date('2025-05-01'), endDate: new Date('2025-05-10'), startTime: '08:00', endTime: '20:00', status: BookingStatus.CANCELLED, totalAmount: 42000, platformFee: 4200, cancellationReason: 'Caregiver had a family emergency', careRequirements: JSON.stringify({ needs: ['physiotherapy-assist', 'mobility-support', 'medicine-management'] }), familyNotes: 'Father needs physiotherapy assistance.' },
    { patientId: patients[2].id, caregiverId: caregivers[0].id, familyId: families[2].id, shiftType: ShiftType.DAY_SHIFT, startDate: new Date('2025-05-15'), endDate: new Date('2025-05-30'), startTime: '08:00', endTime: '20:00', status: BookingStatus.COMPLETED, totalAmount: 45000, platformFee: 4500, careRequirements: JSON.stringify({ needs: ['elderly-companionship', 'feeding', 'medicine-management'] }), familyNotes: 'Short term care for mother-in-law.' },
    { patientId: patients[4].id, caregiverId: caregivers[6].id, familyId: families[4].id, shiftType: ShiftType.TWENTY_FOUR_HOUR, startDate: new Date('2025-05-20'), endDate: new Date('2025-06-05'), startTime: '00:00', endTime: '23:59', status: BookingStatus.COMPLETED, totalAmount: 79200, platformFee: 7920, careRequirements: JSON.stringify({ needs: ['bedridden-care', 'feeding', 'wound-care', 'medicine-management'] }), familyNotes: 'Post-stroke care.' },
  ]

  const bookings = []
  for (const b of bookingsData) {
    const booking = await db.booking.create({ data: b })
    bookings.push(booking)
  }

  // ========================================
  // 6. Payments (5) for completed bookings
  // ========================================
  const completedBookings = bookings.filter((b) => b.status === BookingStatus.COMPLETED)
  await Promise.all(
    completedBookings.slice(0, 5).map((booking, idx) =>
      db.payment.create({
        data: {
          bookingId: booking.id,
          familyId: booking.familyId,
          caregiverId: booking.caregiverId,
          amount: booking.totalAmount,
          platformFee: booking.platformFee,
          caregiverPayout: booking.totalAmount - booking.platformFee,
          status: idx < 4 ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
          paymentMethod: idx % 2 === 0 ? 'razorpay' : 'upi',
          transactionId: `TXN-${Date.now()}-${idx}`,
          paidAt: idx < 4 ? booking.updatedAt : null,
        },
      })
    )
  )

  // ========================================
  // 7. Care Reports (8) for in_progress and completed bookings
  // ========================================
  const reportableBookings = bookings.filter(
    (b) => b.status === BookingStatus.IN_PROGRESS || b.status === BookingStatus.COMPLETED
  )

  const reportsData = [
    { bookingId: reportableBookings[0].id, caregiverId: reportableBookings[0].caregiverId, reportDate: '2025-06-14', activities: JSON.stringify([{ type: CareActivityType.FEEDING, time: '08:30', notes: 'Had dal chawal and sabzi' }, { type: CareActivityType.MEDICINE, time: '09:00', notes: 'Gave Metformin and Amlodipine' }, { type: CareActivityType.MOBILITY, time: '10:00', notes: 'Walked around room with support for 15 min' }, { type: CareActivityType.COMPANIONSHIP, time: '11:00', notes: 'Read newspaper together, talked about old memories' }, { type: CareActivityType.FEEDING, time: '13:00', notes: 'Lunch - roti, sabzi, curd' }, { type: CareActivityType.MEDICINE, time: '21:00', notes: 'Evening medicines given' }]), summary: 'Good day overall. Patient was cheerful and ate well. Walked for 15 minutes with support.', mood: 'good', foodIntake: 'good', medicinesGiven: JSON.stringify([{ name: 'Metformin 500mg', time: '09:00', given: true }, { name: 'Amlodipine 5mg', time: '09:00', given: true }, { name: 'Calcium+VitD', time: '13:00', given: true }]), concerns: 'Blood sugar was slightly high at 180 mg/dL before lunch.' },
    { bookingId: reportableBookings[0].id, caregiverId: reportableBookings[0].caregiverId, reportDate: '2025-06-15', activities: JSON.stringify([{ type: CareActivityType.FEEDING, time: '08:30', notes: 'Oats with milk for breakfast' }, { type: CareActivityType.MEDICINE, time: '09:00', notes: 'Morning medicines given on time' }, { type: CareActivityType.MOBILITY, time: '10:30', notes: 'Walked to balcony, enjoyed fresh air' }, { type: CareActivityType.HYGIENE, time: '11:30', notes: 'Sponge bath given' }, { type: CareActivityType.COMPANIONSHIP, time: '15:00', notes: 'Watched TV together - old Bollywood songs' }]), summary: 'Last day of this booking. Patient was happy and content. All vitals normal.', mood: 'good', foodIntake: 'good', medicinesGiven: JSON.stringify([{ name: 'Metformin 500mg', time: '09:00', given: true }, { name: 'Amlodipine 5mg', time: '09:00', given: true }]), concerns: null },
    { bookingId: reportableBookings[1].id, caregiverId: reportableBookings[1].caregiverId, reportDate: '2025-06-18', activities: JSON.stringify([{ type: CareActivityType.MEDICINE, time: '06:00', notes: 'Morning medicines given - Aspirin, Atorvastatin, Losartan' }, { type: CareActivityType.VITAL_CHECK, time: '06:30', notes: 'BP 130/85, Weight 72kg, Pulse 78' }, { type: CareActivityType.FEEDING, time: '07:30', notes: 'Renal diet breakfast - idli with sambar (low salt)' }, { type: CareActivityType.MOBILITY, time: '09:00', notes: 'Assisted walking for 20 minutes' }, { type: CareActivityType.WOUND_CARE, time: '10:00', notes: 'Surgical site dressing changed. No signs of infection.' }, { type: CareActivityType.MEDICINE, time: '18:00', notes: 'Evening medicines given' }]), summary: 'Stable day. BP is controlled. Surgical wound healing well. Patient walked more today.', mood: 'normal', foodIntake: 'normal', medicinesGiven: JSON.stringify([{ name: 'Aspirin', time: '06:00', given: true }, { name: 'Atorvastatin', time: '06:00', given: true }, { name: 'Losartan', time: '06:00', given: true }]), concerns: 'Patient mentioned mild swelling in left ankle. Will monitor.' },
    { bookingId: reportableBookings[1].id, caregiverId: reportableBookings[1].caregiverId, reportDate: '2025-06-19', activities: JSON.stringify([{ type: CareActivityType.MEDICINE, time: '06:00', notes: 'Morning medicines given' }, { type: CareActivityType.VITAL_CHECK, time: '06:30', notes: 'BP 125/82, Weight 71.8kg, Pulse 76' }, { type: CareActivityType.FEEDING, time: '07:30', notes: 'Moong dal khichdi for breakfast' }, { type: CareActivityType.EXERCISE, time: '09:00', notes: 'Light stretching exercises as per physiotherapist instructions' }, { type: CareActivityType.WOUND_CARE, time: '11:00', notes: 'Wound dressing - healing nicely, reduced discharge' }]), summary: 'Good progress. Weight stable. Wound healing well. Swelling reduced.', mood: 'good', foodIntake: 'normal', medicinesGiven: JSON.stringify([{ name: 'Aspirin', time: '06:00', given: true }, { name: 'Atorvastatin', time: '06:00', given: true }, { name: 'Losartan', time: '06:00', given: true }]), concerns: null },
    { bookingId: reportableBookings[2].id, caregiverId: reportableBookings[2].caregiverId, reportDate: '2025-07-10', activities: JSON.stringify([{ type: CareActivityType.FEEDING, time: '08:00', notes: 'Upma and chai for breakfast' }, { type: CareActivityType.MEDICINE, time: '08:30', notes: 'Donepezil 10mg given' }, { type: CareActivityType.COMPANIONSHIP, time: '09:30', notes: 'Did puzzles and memory games together' }, { type: CareActivityType.MOBILITY, time: '11:00', notes: 'Short walk in the park' }, { type: CareActivityType.FEEDING, time: '13:00', notes: 'Rice, sambar, rasam for lunch' }, { type: CareActivityType.COMPANIONSHIP, time: '15:00', notes: 'Sang old Telugu songs together, patient was very happy' }]), summary: 'Patient was very cheerful today. Remembered some old songs. Good appetite.', mood: 'good', foodIntake: 'good', medicinesGiven: JSON.stringify([{ name: 'Donepezil 10mg', time: '08:30', given: true }, { name: 'Alendronate', time: '07:00', given: true }]), concerns: 'Patient forgot she had lunch and asked for food again at 4PM. Gave a light snack.' },
    { bookingId: reportableBookings[3].id, caregiverId: reportableBookings[3].caregiverId, reportDate: '2025-07-12', activities: JSON.stringify([{ type: CareActivityType.MEDICINE, time: '06:00', notes: 'Levodopa/Carbidopa given on time' }, { type: CareActivityType.VITAL_CHECK, time: '06:30', notes: 'BP 135/88, Pulse 74' }, { type: CareActivityType.FEEDING, time: '07:30', notes: 'High fiber breakfast - oats, fruits' }, { type: CareActivityType.EXERCISE, time: '09:00', notes: 'Physiotherapy exercises - 30 min session. Tremors were mild today.' }, { type: CareActivityType.MOBILITY, time: '11:00', notes: 'Transferred from bed to wheelchair independently with standby assist' }, { type: CareActivityType.WOUND_CARE, time: '14:00', notes: 'Checked bed sores - Stage 1 on lower back. Applied ointment.' }, { type: CareActivityType.MEDICINE, time: '18:00', notes: 'Evening medicines given' }]), summary: 'Active day. Patient participated well in exercises. Bed sore is being monitored.', mood: 'normal', foodIntake: 'normal', medicinesGiven: JSON.stringify([{ name: 'Levodopa/Carbidopa', time: '06:00', given: true }, { name: 'Tamsulosin', time: '22:00', given: true }]), concerns: 'Stage 1 bed sore noticed on lower back. Need to reposition every 2 hours.' },
    { bookingId: reportableBookings[4].id, caregiverId: reportableBookings[4].caregiverId, reportDate: '2025-07-15', activities: JSON.stringify([{ type: CareActivityType.MEDICINE, time: '07:00', notes: 'Insulin injection given - 8 units' }, { type: CareActivityType.FEEDING, time: '07:30', notes: 'Diabetic breakfast - multigrain toast, egg white, green tea' }, { type: CareActivityType.WOUND_CARE, time: '09:00', notes: 'Bed sore dressing changed on back and heel. Both healing.' }, { type: CareActivityType.EXERCISE, time: '10:00', notes: 'Passive range of motion exercises for left arm and leg - 20 min' }, { type: CareActivityType.FEEDING, time: '12:30', notes: 'Small meal - dal, roti, sabzi (portion controlled)' }, { type: CareActivityType.MEDICINE, time: '13:00', notes: 'Pregabalin and Clopidogrel given' }, { type: CareActivityType.MEDICINE, time: '19:00', notes: 'Evening insulin - 8 units' }]), summary: 'Stable condition. Blood sugar 140 mg/dL (fasting). Bed sores improving. Passive exercises done.', mood: 'normal', foodIntake: 'normal', medicinesGiven: JSON.stringify([{ name: 'Insulin', time: '07:00', given: true }, { name: 'Pregabalin', time: '13:00', given: true }, { name: 'Clopidogrel', time: '13:00', given: true }, { name: 'Insulin', time: '19:00', given: true }]), concerns: 'Patient seemed slightly withdrawn today. Spoke less than usual.' },
    { bookingId: reportableBookings[4].id, caregiverId: reportableBookings[4].caregiverId, reportDate: '2025-07-16', activities: JSON.stringify([{ type: CareActivityType.MEDICINE, time: '07:00', notes: 'Insulin 8 units' }, { type: CareActivityType.FEEDING, time: '07:30', notes: 'Idli with coconut chutney' }, { type: CareActivityType.WOUND_CARE, time: '09:00', notes: 'Dressing changed. Heel sore almost healed. Back sore improving.' }, { type: CareActivityType.EXERCISE, time: '10:00', notes: 'ROM exercises - left side showing slight improvement in finger movement' }, { type: CareActivityType.COMPANIONSHIP, time: '14:00', notes: 'Played old Hindi songs. Patient smiled and tried to sing along.' }]), summary: 'Positive day. Patient was more responsive. Finger movement slightly improved. Wounds healing well.', mood: 'good', foodIntake: 'good', medicinesGiven: JSON.stringify([{ name: 'Insulin', time: '07:00', given: true }, { name: 'Pregabalin', time: '13:00', given: true }, { name: 'Clopidogrel', time: '13:00', given: true }, { name: 'Insulin', time: '19:00', given: true }]), concerns: null },
  ]

  await db.careReport.createMany({ data: reportsData })

  // ========================================
  // 8. Reviews (6) for completed bookings
  // ========================================
  const reviewsData = [
    { bookingId: completedBookings[0].id, familyId: families[0].id, caregiverId: completedBookings[0].caregiverId, rating: 5, communicationRating: 5, punctualityRating: 5, careQualityRating: 5, comment: 'Sunita ji was absolutely wonderful with my mother. She treated her like her own family member. Very caring and attentive. Highly recommended!' },
    { bookingId: completedBookings[1].id, familyId: families[1].id, caregiverId: completedBookings[1].caregiverId, rating: 5, communicationRating: 5, punctualityRating: 4, careQualityRating: 5, comment: 'Rajendra is extremely professional. His knowledge of post-surgical care is exceptional. My father recovered well under his care. The only reason for 4 on punctuality is he was late by 10 minutes once.' },
    { bookingId: completedBookings[2].id, familyId: families[2].id, caregiverId: completedBookings[2].caregiverId, rating: 4, communicationRating: 5, punctualityRating: 5, careQualityRating: 4, comment: 'Geeta is very patient and kind. She handled my mother-in-law with dementia very well. The only reason for 4 stars is that I wish she had more experience with dementia specifically. But she is learning fast and genuinely cares.' },
    { bookingId: completedBookings[3].id, familyId: families[3].id, caregiverId: completedBookings[3].caregiverId, rating: 5, communicationRating: 4, punctualityRating: 5, careQualityRating: 5, comment: 'Kamla ji is a gem. Her wound care skills are outstanding. My fathers bed sores started healing within days. She is firm yet caring. Exactly what we needed.' },
    { bookingId: completedBookings[4].id, familyId: families[4].id, caregiverId: completedBookings[4].caregiverId, rating: 4, communicationRating: 4, punctualityRating: 5, careQualityRating: 4, comment: 'Satish is very knowledgeable and experienced. He managed my fathers complex medical needs well. Good communication. Would book again.' },
  ]

  await db.review.createMany({ data: reviewsData as any })

  // ========================================
  // 9. Complaints (3)
  // ========================================
  await db.complaint.createMany({
    data: [
      {
        bookingId: bookings[2].id,
        familyId: families[2].id,
        caregiverId: caregivers[2].id,
        subject: 'Caregiver arrived 45 minutes late on July 5th',
        description: 'The caregiver arrived at 8:45 AM instead of 8:00 AM. This caused disruption in the morning routine and medicine schedule for my mother-in-law who has dementia. I understand traffic can be bad, but a phone call would have helped.',
        status: ComplaintStatus.OPEN,
        priority: 'medium',
      },
      {
        bookingId: bookings[3].id,
        familyId: families[3].id,
        caregiverId: caregivers[4].id,
        subject: 'Rough handling during patient transfer',
        description: 'My father complained that the caregiver was a bit rough while helping him transfer from bed to wheelchair yesterday. He has Parkinsons and needs gentle handling. Please ensure proper technique is followed.',
        status: ComplaintStatus.IN_PROGRESS,
        priority: 'high',
        assignedTo: admins[0].id,
      },
      {
        bookingId: bookings[0].id,
        familyId: families[0].id,
        caregiverId: caregivers[0].id,
        subject: 'Billing discrepancy for overtime hours',
        description: 'I was charged for 2 extra hours on June 10th but the caregiver had left on time at 8 PM. Please check the records and refund the extra amount of Rs 500.',
        status: ComplaintStatus.RESOLVED,
        priority: 'low',
        assignedTo: admins[1].id,
        resolution: 'Verified timing records. Caregiver indeed left at 8 PM. The extra 2 hours were a system error. Refund of Rs 500 has been processed to the family wallet.',
        resolvedAt: new Date('2025-06-20'),
      },
    ],
  })

  // ========================================
  // 10. Notifications (15)
  // ========================================
  await db.notification.createMany({
    data: [
      { userId: families[0].id, type: NotificationType.BOOKING_CONFIRMED, title: 'Booking Confirmed', message: 'Your booking for Shanti Devi with Sunita Devi (June 1-15) has been confirmed.', data: JSON.stringify({ bookingId: bookings[0].id }) },
      { userId: families[0].id, type: NotificationType.CARE_REPORT_SUBMITTED, title: 'Daily Care Report', message: 'A care report has been submitted for Shanti Devi for June 14.', data: JSON.stringify({ bookingId: bookings[0].id }) },
      { userId: families[0].id, type: NotificationType.REVIEW_REQUEST, title: 'Rate Your Experience', message: 'Your care session with Sunita Devi has ended. Please share your feedback.', data: JSON.stringify({ bookingId: bookings[0].id }) },
      { userId: families[0].id, type: NotificationType.PAYMENT_RECEIVED, title: 'Payment Confirmed', message: 'Payment of Rs 42,000 for booking #1 has been received.', data: JSON.stringify({ bookingId: bookings[0].id }) },
      { userId: families[1].id, type: NotificationType.BOOKING_CONFIRMED, title: 'Booking Confirmed', message: 'Your booking for Ramesh Patel with Rajendra Kumar (June 10-20) has been confirmed.', data: JSON.stringify({ bookingId: bookings[1].id }) },
      { userId: families[1].id, type: NotificationType.CARE_REPORT_SUBMITTED, title: 'Daily Care Report', message: 'A care report has been submitted for Ramesh Patel for June 18.', data: JSON.stringify({ bookingId: bookings[1].id }) },
      { userId: families[2].id, type: NotificationType.BOOKING_CONFIRMED, title: 'Booking Confirmed', message: 'Your booking for Lakshmi Reddy with Geeta Rani (July 1-31) has been confirmed.', data: JSON.stringify({ bookingId: bookings[2].id }) },
      { userId: families[2].id, type: NotificationType.URGENT_REQUEST, title: 'Caregiver Running Late', message: 'Your caregiver Geeta Rani is running late today (July 5th). Expected arrival: 8:45 AM.', data: JSON.stringify({ bookingId: bookings[2].id }) },
      { userId: families[3].id, type: NotificationType.BOOKING_CONFIRMED, title: 'Booking Confirmed', message: 'Your booking for Harjeet Singh with Kamla Bai (July 5-20) has been confirmed.', data: JSON.stringify({ bookingId: bookings[3].id }) },
      { userId: families[4].id, type: NotificationType.BOOKING_CONFIRMED, title: 'Booking Confirmed', message: 'Your booking for Kamal Kapoor with Satish Kumar (July 10 onwards) has been confirmed.', data: JSON.stringify({ bookingId: bookings[4].id }) },
      { userId: caregivers[0].userId, type: NotificationType.VERIFICATION_UPDATE, title: 'Verification Approved', message: 'Your documents have been verified and approved. You are now a verified caregiver on SevaSaathi!', data: null },
      { userId: caregivers[1].userId, type: NotificationType.VERIFICATION_UPDATE, title: 'Verification Approved', message: 'Congratulations! All your documents have been verified. Your profile is now verified.', data: null },
      { userId: caregivers[3].userId, type: NotificationType.VERIFICATION_UPDATE, title: 'Verification Update', message: 'Your nursing certificate was rejected. Please re-upload a clear scan of the certificate.', data: JSON.stringify({ reason: 'Certificate is partially visible' }) },
      { userId: admins[0].id, type: NotificationType.SYSTEM, title: 'New Complaint Filed', message: 'A new complaint has been filed by Meena Reddy regarding caregiver Geeta Rani.', data: JSON.stringify({ complaintId: '1' }) },
      { userId: admins[0].id, type: NotificationType.SYSTEM, title: 'Pending Verifications', message: '3 new verification documents are pending review.', data: JSON.stringify({ count: 3 }) },
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log(`   Created: ${admins.length} admins, ${families.length} families, ${caregivers.length} caregivers`)
  console.log(`   Bookings: ${bookings.length}, Patients: ${patients.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
