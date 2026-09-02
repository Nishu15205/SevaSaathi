import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        avatarUrl: true, subscription: true, isActive: true,
        isPhoneVerified: true, isEmailVerified: true,
        createdAt: true, updatedAt: true,
        caregiverProfile: true,
        patientProfiles: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
            complaints: true,
            notifications: true,
          },
        },
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: { select: { name: true } },
            caregiver: { select: { user: { select: { name: true } } } },
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        complaints: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Collect all booking IDs for this user (as family or caregiver)
    const bookings = await db.booking.findMany({
      where: {
        OR: [{ familyId: id }],
      },
      select: { id: true },
    })

    const bookingIds = bookings.map((b) => b.id)

    // Delete related records with unique constraints on bookingId first
    if (bookingIds.length > 0) {
      await db.careReport.deleteMany({
        where: { bookingId: { in: bookingIds } },
      })
      await db.review.deleteMany({
        where: { bookingId: { in: bookingIds } },
      })
      await db.payment.deleteMany({
        where: { bookingId: { in: bookingIds } },
      })
    }

    // Also collect caregiver bookings
    const caregiverProfile = await db.caregiver.findUnique({
      where: { userId: id },
      select: { id: true },
    })

    if (caregiverProfile) {
      const caregiverBookings = await db.booking.findMany({
        where: { caregiverId: caregiverProfile.id },
        select: { id: true },
      })

      const caregiverBookingIds = caregiverBookings.map((b) => b.id)

      if (caregiverBookingIds.length > 0) {
        await db.careReport.deleteMany({
          where: { bookingId: { in: caregiverBookingIds } },
        })
        await db.review.deleteMany({
          where: { bookingId: { in: caregiverBookingIds } },
        })
        await db.payment.deleteMany({
          where: { bookingId: { in: caregiverBookingIds } },
        })
      }
    }

    // Delete bookings, complaints, notifications, verifications
    await db.booking.deleteMany({ where: { familyId: id } })
    if (caregiverProfile) {
      await db.booking.deleteMany({ where: { caregiverId: caregiverProfile.id } })
    }
    await db.complaint.deleteMany({ where: { familyId: id } })
    if (caregiverProfile) {
      await db.complaint.deleteMany({ where: { caregiverId: caregiverProfile.id } })
    }
    await db.notification.deleteMany({ where: { userId: id } })
    if (caregiverProfile) {
      await db.verification.deleteMany({ where: { caregiverId: caregiverProfile.id } })
      await db.caregiver.delete({ where: { id: caregiverProfile.id } })
    }
    await db.patient.deleteMany({ where: { familyId: id } })

    // Delete the user
    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
