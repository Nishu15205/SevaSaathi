import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { emitToUser } from '@/lib/socket'
import { sendCareReportEmail } from '@/lib/email'

const createReportSchema = z.object({
  bookingId: z.string().min(1),
  caregiverId: z.string().min(1),
  reportDate: z.string().min(1),
  activities: z.any(),
  summary: z.string().optional(),
  mood: z.string().default('normal'),
  foodIntake: z.string().default('normal'),
  medicinesGiven: z.any().optional(),
  concerns: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createReportSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const report = await db.careReport.create({
      data: {
        bookingId: data.bookingId,
        caregiverId: data.caregiverId,
        reportDate: data.reportDate,
        activities: typeof data.activities === 'string' ? data.activities : JSON.stringify(data.activities),
        summary: data.summary,
        mood: data.mood,
        foodIntake: data.foodIntake,
        medicinesGiven: data.medicinesGiven
          ? typeof data.medicinesGiven === 'string' ? data.medicinesGiven : JSON.stringify(data.medicinesGiven)
          : null,
        concerns: data.concerns,
      },
      include: {
        caregiver: {
          select: { user: { select: { name: true } } },
        },
        booking: {
          select: {
            patient: { select: { name: true } },
            family: { select: { id: true, name: true } },
          },
        },
      },
    })

    // Notify family about new report
    await db.notification.create({
      data: {
        userId: report.booking.family.id,
        type: 'CARE_REPORT_SUBMITTED',
        title: 'Daily Care Report',
        message: `A care report has been submitted for ${report.booking.patient.name} for ${data.reportDate}`,
        data: JSON.stringify({ bookingId: data.bookingId, reportId: report.id }),
      },
    })

    // Real-time notification
    emitToUser(report.booking.family.id, 'report:new', { reportId: report.id, bookingId: data.bookingId })

    // Email notification
    sendCareReportEmail(report, report.booking as any).catch(() => {})

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const bookingId = searchParams.get('bookingId')
    const caregiverId = searchParams.get('caregiverId')

    const where: Record<string, unknown> = {}
    if (bookingId) where.bookingId = bookingId
    if (caregiverId) where.caregiverId = caregiverId

    if (!bookingId && !caregiverId) {
      return NextResponse.json(
        { error: 'bookingId or caregiverId is required' },
        { status: 400 }
      )
    }

    const reports = await db.careReport.findMany({
      where,
      include: {
        caregiver: {
          select: { user: { select: { name: true } }, id: true },
        },
        booking: {
          select: {
            patient: { select: { name: true } },
          },
        },
      },
      orderBy: { reportDate: 'desc' },
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('List reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
