import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const verifications = await db.verification.findMany({
      where: { status: 'PENDING' },
      include: {
        caregiver: {
          select: {
            id: true,
            city: true,
            yearsExperience: true,
            isVerified: true,
            user: { select: { name: true, phone: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ verifications })
  } catch (error) {
    console.error('List pending verifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
