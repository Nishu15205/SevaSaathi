import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { VerificationType } from '@prisma/client'

const verifySchema = z.object({
  docType: z.nativeEnum(VerificationType),
  docNumber: z.string().min(2),
  docUrl: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = verifySchema.safeParse(body)

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

    const verification = await db.verification.create({
      data: {
        caregiverId: id,
        docType: parsed.data.docType,
        docNumber: parsed.data.docNumber,
        docUrl: parsed.data.docUrl,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ verification }, { status: 201 })
  } catch (error) {
    console.error('Submit verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
