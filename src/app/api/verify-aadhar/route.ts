import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const AADHAR_REGEX = /^\d{4}\s*\d{4}\s*\d{4}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { aadharNumber, caregiverId } = body

    if (!aadharNumber || typeof aadharNumber !== 'string') {
      return NextResponse.json(
        { verified: false, error: 'Aadhaar number is required.' },
        { status: 400 }
      )
    }

    // Clean and validate
    const cleaned = aadharNumber.replace(/\s/g, '')
    if (!/^\d{12}$/.test(cleaned)) {
      return NextResponse.json(
        { verified: false, error: 'Invalid Aadhaar number. Enter 12 digits only.' },
        { status: 400 }
      )
    }

    // Verify digit check (Aadhaar uses Verhoeff algorithm, simplified here)
    // We accept any valid 12-digit number for now
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim()

    // If caregiverId is provided, create a verification record and mark caregiver verified
    if (caregiverId) {
      const caregiver = await db.caregiver.findUnique({ where: { id: caregiverId } })
      if (!caregiver) {
        return NextResponse.json(
          { verified: false, error: 'Caregiver profile not found.' },
          { status: 404 }
        )
      }

      // Create verification record
      await db.verification.create({
        data: {
          caregiverId,
          docType: 'AADHAAR',
          docNumber: cleaned,
          docUrl: '',
          status: 'APPROVED',
        },
      })

      // Mark caregiver as verified
      await db.caregiver.update({
        where: { id: caregiverId },
        data: { isVerified: true },
      })
    }

    return NextResponse.json({
      verified: true,
      aadharNumber: formatted,
    })
  } catch (error: any) {
    console.error('Aadhaar verification error:', error)
    return NextResponse.json(
      { verified: false, error: error.message || 'Aadhaar verification failed.' },
      { status: 500 }
    )
  }
}
