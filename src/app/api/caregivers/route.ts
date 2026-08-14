import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
