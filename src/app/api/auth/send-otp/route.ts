import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendOtpEmail } from '@/lib/email'
import { isBrevoConfigured } from '@/lib/brevo'

// In-memory OTP store (for demo/sandbox - in production use Redis/DB)
export const otpStore = new Map<string, { otp: string; expiresAt: number; purpose: string }>()

// Server-side reset tokens — issued only after OTP is verified server-side
export const resetTokenStore = new Map<string, { email: string; expiresAt: number }>()

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

    // Check if email delivery is configured (Brevo or SMTP)
    const brevoReady = await isBrevoConfigured()

    if (brevoReady) {
      // Real email delivery via Brevo
      await sendOtpEmail(email, otp, purpose)
      return NextResponse.json({
        message: `OTP sent to ${email}`,
        expiresIn: '5 minutes',
      })
    }

    // Try sending anyway (might have SMTP configured)
    const result = await sendOtpEmail(email, otp, purpose)
    if (result.success && !result.error) {
      return NextResponse.json({
        message: `OTP sent to ${email}`,
        expiresIn: '5 minutes',
      })
    }

    // Dev mode: return OTP in response
    console.log(`\n📧 EMAIL OTP for ${email}: ${otp} (dev mode - configure Brevo/SMTP for real delivery)\n`)
    return NextResponse.json({
      message: `OTP sent to ${email} (dev mode)`,
      otp,
      expiresIn: '5 minutes',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
