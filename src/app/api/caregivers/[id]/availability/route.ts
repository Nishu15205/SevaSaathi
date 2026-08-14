import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const availabilitySchema = z.object({
  availabilityJson: z.any(),
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

    const availabilityStr = typeof parsed.data.availabilityJson === 'string'
      ? parsed.data.availabilityJson
      : JSON.stringify(parsed.data.availabilityJson)

    const updated = await db.caregiver.update({
      where: { id },
      data: { availabilityJson: availabilityStr },
    })

    return NextResponse.json({
      caregiver: {
        ...updated,
        availabilityJson: JSON.parse(updated.availabilityJson),
      },
    })
  } catch (error) {
    console.error('Update availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
