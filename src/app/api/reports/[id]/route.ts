import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const report = await db.careReport.findUnique({
      where: { id },
      include: {
        caregiver: {
          select: {
            user: { select: { name: true, phone: true } },
            qualifications: true,
          },
        },
        booking: {
          select: {
            id: true,
            patient: { select: { name: true, age: true, gender: true } },
            family: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
