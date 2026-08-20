import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { patient: { name: { contains: search } } },
        { caregiver: { user: { name: { contains: search } } } },
      ]
    }

    const skip = (page - 1) * limit

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          patient: { select: { name: true, city: true } },
          caregiver: { select: { userId: true, user: { select: { id: true, name: true, email: true } } } },
          family: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List admin bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
