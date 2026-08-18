import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { otpStore } from '../send-otp/route'

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['REGISTER', 'RESET_PASSWORD']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = verifyOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, otp, purpose } = parsed.data
    const key = `${email}:${purpose}`
    const stored = otpStore.get(key)

    if (!stored) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 404 }
      )
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key)
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 410 }
      )
    }

    if (stored.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please check and try again.' },
        { status: 401 }
      )
    }

    // OTP verified - delete it so it can't be reused
    otpStore.delete(key)

    return NextResponse.json({
      message: 'OTP verified successfully',
      verified: true,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
