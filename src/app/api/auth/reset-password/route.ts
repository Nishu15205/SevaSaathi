import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = resetSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, newPassword } = parsed.data

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'This account has been deactivated. Contact support for help.' },
        { status: 403 }
      )
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({
      message: 'Password reset successful. You can now login with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
