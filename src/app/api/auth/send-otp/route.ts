import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// In-memory OTP store (for demo/sandbox - in production use Redis/DB)
export const otpStore = new Map<string, { otp: string; expiresAt: number; purpose: string }>()

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['REGISTER', 'RESET_PASSWORD']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = sendOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, purpose } = parsed.data

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

    // Store OTP
    otpStore.set(`${email}:${purpose}`, { otp, expiresAt, purpose })

    // In production, you would send this OTP via email service (e.g., Resend, SendGrid, AWS SES)
    // For demo/sandbox, we return the OTP in the response so the user can use it
    return NextResponse.json({
      message: `OTP sent to ${email} (check response for demo OTP)`,
      otp, // ONLY for demo! Remove in production.
      expiresIn: '5 minutes',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
