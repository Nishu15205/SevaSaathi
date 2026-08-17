import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const changeSchema = z.object({
  userId: z.string().min(1),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = changeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { userId, currentPassword, newPassword } = parsed.data

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, isActive: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    return NextResponse.json({ message: 'Password changed successfully.' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
