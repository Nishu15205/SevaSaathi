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

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Mark all fetched notifications as read
    if (notifications.length > 0) {
      await db.notification.updateMany({
        where: {
          userId,
          id: { in: notifications.map((n) => n.id) },
        },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('List notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
