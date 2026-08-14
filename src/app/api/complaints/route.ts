import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createComplaintSchema = z.object({
  bookingId: z.string().optional(),
  familyId: z.string().min(1),
  caregiverId: z.string().min(1),
  subject: z.string().min(5),
  description: z.string().min(10),
  priority: z.string().default('medium'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createComplaintSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const complaint = await db.complaint.create({
      data: {
        bookingId: data.bookingId || null,
        familyId: data.familyId,
        caregiverId: data.caregiverId,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
      },
      include: {
        family: { select: { name: true, phone: true } },
        caregiver: { select: { user: { select: { name: true } } } },
        booking: { select: { id: true, startDate: true, shiftType: true } },
      },
    })

    // Notify admins
    const admins = await db.user.findMany({ where: { role: 'ADMIN', isActive: true } })
    await Promise.all(
      admins.map((admin) =>
        db.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: 'New Complaint Filed',
            message: `Complaint from ${complaint.family.name}: ${data.subject}`,
            data: JSON.stringify({ complaintId: complaint.id }),
          },
        })
      )
    )

    return NextResponse.json({ complaint }, { status: 201 })
  } catch (error) {
    console.error('Create complaint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const familyId = searchParams.get('familyId')
    const caregiverId = searchParams.get('caregiverId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (familyId) where.familyId = familyId
    if (caregiverId) where.caregiverId = caregiverId

    const complaints = await db.complaint.findMany({
      where,
      include: {
        family: { select: { name: true, phone: true } },
        caregiver: { select: { user: { select: { name: true } } } },
        assignee: { select: { name: true } },
        booking: { select: { id: true, startDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ complaints })
  } catch (error) {
    console.error('List complaints error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
