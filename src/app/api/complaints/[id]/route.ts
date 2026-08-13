import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { ComplaintStatus } from '@prisma/client'

const updateComplaintSchema = z.object({
  status: z.nativeEnum(ComplaintStatus),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateComplaintSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await db.complaint.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
    }

    if (parsed.data.assignedTo) updateData.assignedTo = parsed.data.assignedTo
    if (parsed.data.resolution) {
      updateData.resolution = parsed.data.resolution
      updateData.resolvedAt = new Date()
    }

    if (parsed.data.status === ComplaintStatus.RESOLVED && !parsed.data.resolution) {
      updateData.resolvedAt = new Date()
    }

    const complaint = await db.complaint.update({
      where: { id },
      data: updateData,
      include: {
        family: { select: { name: true, phone: true } },
        caregiver: { select: { user: { select: { name: true } } } },
        assignee: { select: { name: true } },
      },
    })

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error('Update complaint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
