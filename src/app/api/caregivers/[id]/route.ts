import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

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

const updateCaregiverSchema = z.object({
  city: z.string().min(1).optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  qualifications: z.any().optional(),
  skills: z.any().optional(),
  languages: z.any().optional(),
  bio: z.string().optional(),
  hourlyRate: z.number().int().min(0).optional(),
  availabilityJson: z.any().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateCaregiverSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await db.caregiver.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 })
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    if (data.city !== undefined) updateData.city = data.city
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.address !== undefined) updateData.address = data.address
    if (data.pincode !== undefined) updateData.pincode = data.pincode
    if (data.yearsExperience !== undefined) updateData.yearsExperience = data.yearsExperience
    if (data.qualifications !== undefined)
      updateData.qualifications = typeof data.qualifications === 'string' ? data.qualifications : JSON.stringify(data.qualifications)
    if (data.skills !== undefined)
      updateData.skills = typeof data.skills === 'string' ? data.skills : JSON.stringify(data.skills)
    if (data.languages !== undefined)
      updateData.languages = data.languages ? (typeof data.languages === 'string' ? data.languages : JSON.stringify(data.languages)) : null
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate
    if (data.availabilityJson !== undefined)
      updateData.availabilityJson = typeof data.availabilityJson === 'string' ? data.availabilityJson : JSON.stringify(data.availabilityJson)

    const caregiver = await db.caregiver.update({
      where: { id },
      data: updateData,
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

    const result = {
      ...caregiver,
      skills: JSON.parse(caregiver.skills),
      qualifications: JSON.parse(caregiver.qualifications),
      languages: caregiver.languages ? JSON.parse(caregiver.languages) : [],
      availabilityJson: JSON.parse(caregiver.availabilityJson),
    }

    return NextResponse.json({ caregiver: result })
  } catch (error) {
    console.error('Update caregiver error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
