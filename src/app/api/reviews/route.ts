import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  familyId: z.string().min(1),
  caregiverId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  communicationRating: z.number().int().min(1).max(5),
  punctualityRating: z.number().int().min(1).max(5),
  careQualityRating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existingReview = await db.review.findUnique({ where: { bookingId: data.bookingId } })
    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this booking' },
        { status: 409 }
      )
    }

    const review = await db.review.create({
      data: {
        bookingId: data.bookingId,
        familyId: data.familyId,
        caregiverId: data.caregiverId,
        rating: data.rating,
        communicationRating: data.communicationRating,
        punctualityRating: data.punctualityRating,
        careQualityRating: data.careQualityRating,
        comment: data.comment,
      },
      include: {
        family: { select: { name: true } },
        caregiver: { select: { user: { select: { name: true } } } },
      },
    })

    // Update caregiver average rating
    const allReviews = await db.review.findMany({
      where: { caregiverId: data.caregiverId, isPublished: true },
    })
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = totalRating / allReviews.length

    await db.caregiver.update({
      where: { id: data.caregiverId },
      data: {
        overallRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      },
    })

    // Notify family to review
    await db.notification.create({
      data: {
        userId: data.familyId,
        type: 'REVIEW_REQUEST',
        title: 'Thank You for Your Review!',
        message: 'Your feedback helps us improve care quality.',
        data: JSON.stringify({ reviewId: review.id }),
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const caregiverId = request.nextUrl.searchParams.get('caregiverId')

    if (!caregiverId) {
      return NextResponse.json(
        { error: 'caregiverId query parameter is required' },
        { status: 400 }
      )
    }

    const reviews = await db.review.findMany({
      where: { caregiverId, isPublished: true },
      include: {
        family: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('List reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
