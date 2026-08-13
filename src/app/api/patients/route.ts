import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const familyId = request.nextUrl.searchParams.get('familyId')

    if (!familyId) {
      return NextResponse.json(
        { error: 'familyId query parameter is required' },
        { status: 400 }
      )
    }

    const patients = await db.patient.findMany({
      where: { familyId, isActive: true },
      include: {
        _count: {
          select: { bookings: true },
        },
        family: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ patients })
  } catch (error) {
    console.error('List patients error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createPatientSchema = z.object({
  familyId: z.string().min(1),
  name: z.string().min(2),
  age: z.number().int().min(0).max(150),
  gender: z.string().min(1),
  relationship: z.string().min(1),
  address: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().optional(),
  medicalHistory: z.any(),
  dietaryNeeds: z.string().optional(),
  mobilityStatus: z.string().default('mobile'),
  careRequirements: z.any(),
  preferredLanguage: z.string().optional(),
  emergencyContact: z.any(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createPatientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const patient = await db.patient.create({
      data: {
        familyId: data.familyId,
        name: data.name,
        age: data.age,
        gender: data.gender,
        relationship: data.relationship,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        medicalHistory: typeof data.medicalHistory === 'string' ? data.medicalHistory : JSON.stringify(data.medicalHistory),
        dietaryNeeds: data.dietaryNeeds,
        mobilityStatus: data.mobilityStatus,
        careRequirements: typeof data.careRequirements === 'string' ? data.careRequirements : JSON.stringify(data.careRequirements),
        preferredLanguage: data.preferredLanguage,
        emergencyContact: typeof data.emergencyContact === 'string' ? data.emergencyContact : JSON.stringify(data.emergencyContact),
      },
    })

    return NextResponse.json({ patient }, { status: 201 })
  } catch (error) {
    console.error('Create patient error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
