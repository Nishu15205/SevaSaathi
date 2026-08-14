import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const city = searchParams.get('city')
    const skill = searchParams.get('skill')
    const isVerified = searchParams.get('isVerified')
    const minRating = searchParams.get('minRating')
    const shift = searchParams.get('shift')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const where: Record<string, unknown> = { isActive: true }

    if (city) {
      where.city = { contains: city }
    }

    if (isVerified !== null && isVerified !== '') {
      where.isVerified = isVerified === 'true'
    }

    if (minRating) {
      where.overallRating = { gte: parseFloat(minRating) }
    }

    if (skill) {
      where.skills = { contains: skill }
    }

    const skip = (page - 1) * limit

    const [caregivers, total] = await Promise.all([
      db.caregiver.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, phone: true, avatarUrl: true },
          },
          _count: {
            select: { reviews: true, bookings: true },
          },
        },
        orderBy: { overallRating: 'desc' },
        skip,
        take: limit,
      }),
      db.caregiver.count({ where }),
    ])

    const results = caregivers.map((c) => ({
      ...c,
      skills: JSON.parse(c.skills),
      qualifications: JSON.parse(c.qualifications),
      languages: c.languages ? JSON.parse(c.languages) : [],
      availabilityJson: JSON.parse(c.availabilityJson),
    }))

    return NextResponse.json({
      caregivers: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List caregivers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const DEFAULT_AVAILABILITY = {
  mon: { day: true, night: true },
  tue: { day: true, night: true },
  wed: { day: true, night: true },
  thu: { day: true, night: true },
  fri: { day: true, night: true },
  sat: { day: true, night: false },
  sun: { day: true, night: false },
}

const createCaregiverSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  city: z.string().min(1, 'city is required'),
  gender: z.string().optional(),
  address: z.string().default(''),
  pincode: z.string().optional(),
  yearsExperience: z.number().int().min(0).default(0),
  qualifications: z.any(),
  skills: z.any(),
  languages: z.any(),
  bio: z.string().optional(),
  hourlyRate: z.number().int().min(0).default(0),
  availabilityJson: z.any(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createCaregiverSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const caregiver = await db.caregiver.create({
      data: {
        userId: data.userId,
        city: data.city,
        gender: data.gender,
        address: data.address,
        pincode: data.pincode,
        yearsExperience: data.yearsExperience,
        qualifications: typeof data.qualifications === 'string' ? data.qualifications : JSON.stringify(data.qualifications ?? []),
        skills: typeof data.skills === 'string' ? data.skills : JSON.stringify(data.skills ?? []),
        languages: data.languages ? (typeof data.languages === 'string' ? data.languages : JSON.stringify(data.languages)) : null,
        bio: data.bio,
        hourlyRate: data.hourlyRate,
        availabilityJson: data.availabilityJson
          ? (typeof data.availabilityJson === 'string' ? data.availabilityJson : JSON.stringify(data.availabilityJson))
          : JSON.stringify(DEFAULT_AVAILABILITY),
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
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

    return NextResponse.json({ caregiver: result }, { status: 201 })
  } catch (error: unknown) {
    console.error('Create caregiver error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'A caregiver profile already exists for this user' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
