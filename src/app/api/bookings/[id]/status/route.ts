import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { BookingStatus } from '@prisma/client'

const updateStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  cancellationReason: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const booking = await db.booking.findUnique({ where: { id } })
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
    }

    if (parsed.data.cancellationReason) {
      updateData.cancellationReason = parsed.data.cancellationReason
    }

    if (parsed.data.status === BookingStatus.IN_PROGRESS && !booking.caregiverNotes) {
      updateData.caregiverNotes = `Care started at ${new Date().toLocaleString('en-IN')}`
    }

    const updated = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { name: true } },
        caregiver: { select: { user: { select: { name: true } } } },
        family: { select: { name: true } },
      },
    })

    const notifType = parsed.data.status === BookingStatus.CANCELLED ? 'BOOKING_CANCELLED' : 'CAREGIVER_ARRIVED'
    await db.notification.create({
      data: {
        userId: booking.familyId,
        type: notifType,
        title: parsed.data.status === BookingStatus.CANCELLED ? 'Booking Cancelled' : 'Caregiver Arrived',
        message: `Booking for ${updated.patient.name} has been ${parsed.data.status.toLowerCase().replace('_', ' ')}`,
        data: JSON.stringify({ bookingId: id }),
      },
    })

    return NextResponse.json({ booking: updated })
  } catch (error) {
    console.error('Update booking status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
