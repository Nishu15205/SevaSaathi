import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const [
      totalUsers,
      totalCaregivers,
      totalBookings,
      activeBookings,
      completedBookings,
      ratingAgg,
      revenueAgg,
      complaintsByStatus,
      bookingsByStatus,
      caregiversByCity,
    ] = await Promise.all([
      db.user.count({ where: { role: { in: ['FAMILY', 'CAREGIVER'] }, isActive: true } }),
      db.caregiver.count({ where: { isActive: true } }),
      db.booking.count(),
      db.booking.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
      db.booking.count({ where: { status: 'COMPLETED' } }),
      db.caregiver.aggregate({
        _avg: { overallRating: true },
        _count: true,
      }),
      db.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true, platformFee: true },
      }),
      db.complaint.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.booking.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.caregiver.groupBy({
        by: ['city'],
        _count: true,
      }),
    ])

    const complaintsMap: Record<string, number> = {}
    for (const c of complaintsByStatus) {
      complaintsMap[c.status] = c._count
    }

    const bookingsMap: Record<string, number> = {}
    for (const b of bookingsByStatus) {
      bookingsMap[b.status] = b._count
    }

    const cityMap: Record<string, number> = {}
    for (const c of caregiversByCity) {
      cityMap[c.city] = c._count
    }

    return NextResponse.json({
      totalUsers,
      totalCaregivers,
      totalBookings,
      activeBookings,
      completedBookings,
      averageRating: ratingAgg._avg.overallRating
        ? Math.round(ratingAgg._avg.overallRating * 10) / 10
        : 0,
      totalRevenue: revenueAgg._sum.amount || 0,
      totalPlatformFee: revenueAgg._sum.platformFee || 0,
      complaintsByStatus: complaintsMap,
      bookingsByStatus: bookingsMap,
      caregiversByCity: cityMap,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
