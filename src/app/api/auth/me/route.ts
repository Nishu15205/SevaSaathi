import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        subscription: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        patientProfiles: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true,
            relationship: true,
            city: true,
            mobilityStatus: true,
            isActive: true,
          },
        },
        caregiverProfile: {
          select: {
            id: true,
            city: true,
            yearsExperience: true,
            skills: true,
            languages: true,
            hourlyRate: true,
            overallRating: true,
            totalReviews: true,
            completedJobs: true,
            isVerified: true,
            isActive: true,
            bio: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
