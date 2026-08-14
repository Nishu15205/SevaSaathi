import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const caregiver = await db.caregiver.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true, avatarUrl: true, isActive: true },
        },
        verifications: {
          select: {
            id: true,
            docType: true,
            docNumber: true,
            status: true,
            reviewedAt: true,
            rejectionReason: true,
          },
        },
        reviews: {
          where: { isPublished: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            family: { select: { name: true } },
          },
        },
        _count: {
          select: { reviews: true, bookings: true, careReports: true },
        },
      },
    })

    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 })
    }

    const result = {
      ...caregiver,
      skills: JSON.parse(caregiver.skills),
      qualifications: JSON.parse(caregiver.qualifications),
      languages: caregiver.languages ? JSON.parse(caregiver.languages) : [],
      availabilityJson: JSON.parse(caregiver.availabilityJson),
    }

    return NextResponse.json({ caregiver: result })
  } catch (error) {
    console.error('Get caregiver error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
