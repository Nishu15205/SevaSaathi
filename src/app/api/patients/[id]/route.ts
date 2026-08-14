import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const patient = await db.patient.findUnique({
      where: { id },
      include: {
        family: {
          select: { id: true, name: true, phone: true, email: true },
        },
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            caregiver: {
              select: { id: true, user: { select: { name: true } }, hourlyRate: true },
            },
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ patient })
  } catch (error) {
    console.error('Get patient error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const updatePatientSchema = z.object({
  name: z.string().min(2).optional(),
  age: z.number().int().min(0).max(150).optional(),
  gender: z.string().min(1).optional(),
  relationship: z.string().min(1).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  pincode: z.string().optional(),
  medicalHistory: z.any().optional(),
  dietaryNeeds: z.string().nullable().optional(),
  mobilityStatus: z.string().optional(),
  careRequirements: z.any().optional(),
  preferredLanguage: z.string().nullable().optional(),
  emergencyContact: z.any().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updatePatientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await db.patient.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.age !== undefined) updateData.age = data.age
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.relationship !== undefined) updateData.relationship = data.relationship
    if (data.address !== undefined) updateData.address = data.address
    if (data.city !== undefined) updateData.city = data.city
    if (data.pincode !== undefined) updateData.pincode = data.pincode
    if (data.dietaryNeeds !== undefined) updateData.dietaryNeeds = data.dietaryNeeds
    if (data.mobilityStatus !== undefined) updateData.mobilityStatus = data.mobilityStatus
    if (data.preferredLanguage !== undefined) updateData.preferredLanguage = data.preferredLanguage
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.medicalHistory !== undefined) {
      updateData.medicalHistory = typeof data.medicalHistory === 'string' ? data.medicalHistory : JSON.stringify(data.medicalHistory)
    }
    if (data.careRequirements !== undefined) {
      updateData.careRequirements = typeof data.careRequirements === 'string' ? data.careRequirements : JSON.stringify(data.careRequirements)
    }
    if (data.emergencyContact !== undefined) {
      updateData.emergencyContact = typeof data.emergencyContact === 'string' ? data.emergencyContact : JSON.stringify(data.emergencyContact)
    }

    const patient = await db.patient.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ patient })
  } catch (error) {
    console.error('Update patient error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
