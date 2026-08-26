import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { resetTokenStore } from '../send-otp/route'

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  // resetToken is issued server-side after OTP verification — NOT from client trust
  resetToken: z.string().min(1, 'Reset token is required. Please verify your email OTP first.'),
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

    const { email, newPassword, resetToken } = parsed.data

    // Validate the server-side reset token
    const tokenData = resetTokenStore.get(resetToken)
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please start the password reset process again.' },
        { status: 401 }
      )
    }

    // Token must belong to the same email
    if (tokenData.email.toLowerCase() !== email.toLowerCase()) {
      resetTokenStore.delete(resetToken)
      return NextResponse.json(
        { error: 'Email mismatch. Please start the password reset process again.' },
        { status: 401 }
      )
    }

    // Token must not be expired
    if (Date.now() > tokenData.expiresAt) {
      resetTokenStore.delete(resetToken)
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new OTP and try again.' },
        { status: 410 }
      )
    }

    // Consume the token (one-time use)
    resetTokenStore.delete(resetToken)

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
