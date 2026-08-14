import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true, name: true, age: true, gender: true,
            relationship: true, city: true, mobilityStatus: true,
            medicalHistory: true, careRequirements: true,
          },
        },
        caregiver: {
          select: {
            id: true, city: true, yearsExperience: true,
            skills: true, hourlyRate: true, overallRating: true,
            isVerified: true, bio: true,
            user: { select: { name: true, phone: true, avatarUrl: true } },
          },
        },
        family: {
          select: { id: true, name: true, phone: true, email: true },
        },
        payment: {
          select: {
            id: true, amount: true, platformFee: true,
            caregiverPayout: true, status: true,
            paymentMethod: true, transactionId: true, paidAt: true,
          },
        },
        careReports: {
          orderBy: { reportDate: 'desc' },
          take: 10,
        },
        reviews: {
          select: {
            id: true, rating: true, comment: true, createdAt: true,
          },
        },
        complaints: {
          select: {
            id: true, subject: true, status: true, priority: true, createdAt: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
