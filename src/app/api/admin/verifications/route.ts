import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { caregiver: { user: { name: { contains: search } } } },
        { docNumber: { contains: search } },
        { docType: { contains: search } },
      ]
    }

    const verifications = await db.verification.findMany({
      where,
      include: {
        caregiver: {
          select: {
            id: true,
            city: true,
            yearsExperience: true,
            isVerified: true,
            user: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ verifications })
  } catch (error) {
    console.error('List verifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
