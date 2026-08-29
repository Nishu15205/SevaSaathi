import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { VerificationStatus } from '@prisma/client'

const updateVerificationSchema = z.object({
  status: z.nativeEnum(VerificationStatus),
  rejectionReason: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateVerificationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await db.verification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      reviewedAt: new Date(),
    }

    if (parsed.data.rejectionReason) {
      updateData.rejectionReason = parsed.data.rejectionReason
    }

    if (parsed.data.status === VerificationStatus.REJECTED && !parsed.data.rejectionReason) {
      updateData.rejectionReason = 'Document does not meet our verification standards'
    }

    const verification = await db.verification.update({
      where: { id },
      data: updateData,
      include: {
        caregiver: {
          select: { id: true, isVerified: true, userId: true, user: { select: { name: true, id: true, phoneVerified: true } } },
        },
      },
    })

    // If approved, check if all 3 conditions are met: phone verified + Aadhaar + ID card
    if (parsed.data.status === VerificationStatus.APPROVED) {
      const allDocs = await db.verification.findMany({
        where: { caregiverId: existing.caregiverId },
      })

      const allApproved = allDocs.every((d) => d.status === VerificationStatus.APPROVED)
      const hasRejection = allDocs.some((d) => d.status === VerificationStatus.REJECTED)
      const phoneVerified = verification.caregiver.user.phoneVerified

      if (allApproved && !hasRejection && phoneVerified) {
        await db.caregiver.update({
          where: { id: existing.caregiverId },
          data: { isVerified: true },
        })

        // Notify caregiver
        await db.notification.create({
          data: {
            userId: verification.caregiver.user.id,
            type: 'VERIFICATION_UPDATE',
            title: 'You are now a Verified Caregiver!',
            message: 'All your documents and phone number have been verified. You now have the verified badge and will get higher visibility in search results!',
            data: null,
          },
        })
      } else if (allApproved && !hasRejection && !phoneVerified) {
        // Documents approved but phone not verified yet
        await db.notification.create({
          data: {
            userId: verification.caregiver.user.id,
            type: 'VERIFICATION_UPDATE',
            title: 'Documents Approved — Verify Phone for Badge',
            message: 'Your documents have been approved! Verify your phone number to get the verified caregiver badge.',
            data: null,
          },
        })
      }
    }

    // Notify caregiver about status change
    await db.notification.create({
      data: {
        userId: verification.caregiver.user.id,
        type: 'VERIFICATION_UPDATE',
        title: `Document ${parsed.data.status === VerificationStatus.APPROVED ? 'Approved' : 'Rejected'}`,
        message: `Your ${existing.docType} document has been ${parsed.data.status.toLowerCase()}. ${parsed.data.rejectionReason || ''}`,
        data: JSON.stringify({ verificationId: id, reason: parsed.data.rejectionReason }),
      },
    })

    return NextResponse.json({ verification })
  } catch (error) {
    console.error('Update verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
