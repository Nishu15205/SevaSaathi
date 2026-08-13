import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { ShiftType } from '@prisma/client'

const urgentSchema = z.object({
  patientId: z.string().min(1),
  familyId: z.string().min(1),
  caregiverId: z.string().optional(),
  shiftType: z.nativeEnum(ShiftType),
  careRequirements: z.any(),
  familyNotes: z.string().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _bookingId } = await params
    const body = await request.json()
    const parsed = urgentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data
    const today = new Date().toISOString().split('T')[0]

    let hourlyRate = 300 // default urgent rate
    if (data.caregiverId) {
      const caregiver = await db.caregiver.findUnique({ where: { id: data.caregiverId } })
      if (caregiver) hourlyRate = caregiver.hourlyRate
    }

    const start = new Date(`2000-01-01T${data.startTime}`)
    const end = new Date(`2000-01-01T${data.endTime}`)
    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    if (hours < 0) hours += 24

    const totalAmount = Math.round(hourlyRate * hours * 1.25) // 25% urgent surcharge
    const platformFee = Math.round(totalAmount * 0.1)

    const booking = await db.booking.create({
      data: {
        patientId: data.patientId,
        caregiverId: data.caregiverId || '',
        familyId: data.familyId,
        shiftType: data.shiftType,
        startDate: new Date(today),
        endDate: null,
        startTime: data.startTime,
        endTime: data.endTime,
        careRequirements: typeof data.careRequirements === 'string' ? data.careRequirements : JSON.stringify(data.careRequirements),
        familyNotes: data.familyNotes ? `[URGENT] ${data.familyNotes}` : '[URGENT] Urgent care request',
        totalAmount,
        platformFee,
        status: 'PENDING',
      },
      include: {
        patient: { select: { id: true, name: true, age: true } },
        family: { select: { id: true, name: true, phone: true } },
      },
    })

    // Notify admins about urgent request
    const admins = await db.user.findMany({ where: { role: 'ADMIN', isActive: true } })
    await Promise.all(
      admins.map((admin) =>
        db.notification.create({
          data: {
            userId: admin.id,
            type: 'URGENT_REQUEST',
            title: 'Urgent Care Request',
            message: `Urgent care needed for ${booking.patient.name}. Family: ${booking.family.name}.`,
            data: JSON.stringify({ bookingId: booking.id }),
          },
        })
      )
    )

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Urgent booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
