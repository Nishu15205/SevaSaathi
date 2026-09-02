import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const availabilitySchema = z.object({
  availabilityJson: z.any().transform(v => typeof v === 'string' ? v : v ? JSON.stringify(v) : '[]'),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = availabilitySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const caregiver = await db.caregiver.findUnique({ where: { id } })
    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 })
    }

    const updated = await db.caregiver.update({
      where: { id },
      data: { availabilityJson: parsed.data.availabilityJson },
    })

    let parsedAvailability: any = [];
    try {
      parsedAvailability = JSON.parse(updated.availabilityJson);
    } catch { /* keep default [] */ }

    return NextResponse.json({
      caregiver: {
        ...updated,
        availabilityJson: parsedAvailability,
      },
    })
  } catch (error) {
    console.error('Update availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
