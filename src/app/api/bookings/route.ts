import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { ShiftType } from '@prisma/client'

const createBookingSchema = z.object({
  patientId: z.string().min(1),
  caregiverId: z.string().min(1),
  familyId: z.string().min(1),
  shiftType: z.nativeEnum(ShiftType),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  careRequirements: z.any(),
  familyNotes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createBookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const caregiver = await db.caregiver.findUnique({ where: { id: data.caregiverId } })
    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 })
    }

    const parseTimeToHours = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number)
      return h + m / 60
    }
    const startHours = parseTimeToHours(data.startTime)
    const endHours = parseTimeToHours(data.endTime)
    let hours = endHours - startHours
    if (hours < 0) hours += 24 // overnight shift
    if (hours === 0) hours = 24 // full day

    const totalDays = data.endDate
      ? Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1

    const totalAmount = Math.max(1, Math.round(caregiver.hourlyRate * hours * totalDays))
    const platformFee = Math.round(totalAmount * 0.1)

    const booking = await db.booking.create({
      data: {
        patientId: data.patientId,
        caregiverId: data.caregiverId,
        familyId: data.familyId,
        shiftType: data.shiftType,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        careRequirements: typeof data.careRequirements === 'string' ? data.careRequirements : JSON.stringify(data.careRequirements),
        familyNotes: data.familyNotes,
        totalAmount,
        platformFee,
      },
      include: {
        patient: { select: { id: true, name: true, age: true, gender: true } },
        caregiver: { select: { id: true, user: { select: { name: true, phone: true } }, hourlyRate: true } },
        family: { select: { id: true, name: true, phone: true } },
      },
    })

    await db.notification.create({
      data: {
        userId: data.familyId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: `Your booking for ${booking.patient.name} has been created. Total: Rs ${totalAmount}`,
        data: JSON.stringify({ bookingId: booking.id }),
      },
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const familyId = searchParams.get('familyId')
    const caregiverId = searchParams.get('caregiverId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const where: Record<string, unknown> = {}

    if (familyId) where.familyId = familyId
    if (caregiverId) where.caregiverId = caregiverId
    if (status) where.status = status

    if (!familyId && !caregiverId) {
      return NextResponse.json(
        { error: 'familyId or caregiverId is required' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, age: true, gender: true, city: true } },
          caregiver: { select: { id: true, user: { select: { name: true, phone: true } }, hourlyRate: true, isVerified: true } },
          payment: { select: { id: true, status: true, amount: true, paidAt: true } },
          careReports: { select: { id: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('List bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
