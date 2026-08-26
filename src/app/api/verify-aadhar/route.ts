import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Verhoeff algorithm tables for Aadhaar check digit validation (UIDAI standard)
const d = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,2,3,4,0,6,7,8,9,5],
  [2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8],
  [5,9,8,7,6,0,1,2,3,4],
  [6,5,9,8,7,1,0,4,3,2],
  [7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0],
]

const p = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,5,7,6,2,8,3,0,9,4],
  [5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],
  [4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],
  [7,0,4,6,9,1,3,8,5,2],
]

function verhoeffValidate(numStr: string): boolean {
  let c = 0
  const reversed = numStr.split('').reverse()
  for (let i = 0; i < reversed.length; i++) {
    const digit = parseInt(reversed[i], 10)
    c = d[c][p[i % 8][digit]]
  }
  return c === 0
}

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

    // Validate the Aadhaar check digit using the Verhoeff algorithm (UIDAI standard)
    if (!verhoeffValidate(cleaned)) {
      return NextResponse.json(
        { verified: false, error: 'Invalid Aadhaar number. The checksum digit does not match.' },
        { status: 400 }
      )
    }

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
