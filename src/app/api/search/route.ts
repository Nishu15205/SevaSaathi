import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ShiftType } from '@prisma/client'

/** Safely parse JSON — returns the raw value if parsing fails */
function safeJsonParse(val: string | null | undefined, fallback: unknown = []): unknown {
  if (!val) return fallback
  if (Array.isArray(val)) return val
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    if (val.includes(',')) return val.split(',').map(s => s.trim()).filter(Boolean)
    return fallback
  }
}

interface ScoredCaregiver {
  id: string
  userId: string
  city: string
  skills: string[]
 yearsExperience: number
  hourlyRate: number
  overallRating: number
  totalReviews: number
  completedJobs: number
  isVerified: boolean
  bio: string | null
  availabilityJson: Record<string, { day: boolean; night: boolean }>
  user: { id: string; name: string; phone: string; avatarUrl: string | null }
  matchScore: number
  scoreBreakdown: {
    skill: number
    location: number
    experience: number
    availability: number
    rating: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const city = searchParams.get('city') || ''
    const skillsParam = searchParams.get('skills') || ''
    const shiftType = searchParams.get('shiftType') || ''
    const date = searchParams.get('date') || ''
    const patientAge = parseInt(searchParams.get('patientAge') || '0', 10)
    const mobilityStatus = searchParams.get('mobilityStatus') || ''

    const requiredSkills = skillsParam ? skillsParam.split(',').map((s) => s.trim().toLowerCase()) : []

    const caregivers = await db.caregiver.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
      },
    })

    const dayOfWeek = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase() : ''

    const scored: ScoredCaregiver[] = []

    for (const c of caregivers) {
      const rawSkills = safeJsonParse(c.skills)
      const caregiverSkills: string[] = Array.isArray(rawSkills) ? rawSkills : []
      const rawAvail = safeJsonParse(c.availabilityJson, {})
      const availability: Record<string, { day: boolean; night: boolean }> = (typeof rawAvail === 'object' && !Array.isArray(rawAvail) ? rawAvail : {}) as Record<string, { day: boolean; night: boolean }>

      // Skill Match: 30%
      let skillScore = 0
      if (requiredSkills.length > 0) {
        const matchedSkills = requiredSkills.filter((s) =>
          caregiverSkills.some((cs) => cs.toLowerCase().includes(s) || s.includes(cs.toLowerCase()))
        )
        skillScore = (matchedSkills.length / requiredSkills.length) * 30
      } else {
        skillScore = 15 // neutral when no filter
      }

      // Location Match: 25%
      let locationScore = 0
      if (city) {
        if (c.city.toLowerCase() === city.toLowerCase()) {
          locationScore = 25
        } else {
          const sameRegion =
            (city.toLowerCase().includes('delhi') && c.city.toLowerCase().includes('delhi')) ||
            (city.toLowerCase().includes('noida') && c.city.toLowerCase().includes('noida')) ||
            (city.toLowerCase().includes('gurgaon') && (c.city.toLowerCase().includes('gurgaon') || c.city.toLowerCase().includes('gurugram')))
          locationScore = sameRegion ? 15 : 5
        }
      } else {
        locationScore = 12.5
      }

      // Experience Match: 20%
      let experienceScore = 0
      if (patientAge > 75 || mobilityStatus === 'bedridden' || mobilityStatus === 'wheelchair') {
        experienceScore = Math.min(20, (c.yearsExperience / 10) * 20)
      } else {
        experienceScore = Math.min(20, (c.yearsExperience / 8) * 20)
      }

      // Availability Match: 15%
      let availabilityScore = 7.5 // default neutral
      if (dayOfWeek && availability[dayOfWeek]) {
        const isDayShift = shiftType === ShiftType.DAY_SHIFT || shiftType === ShiftType.TWELVE_HOUR || shiftType === ShiftType.HOURLY
        const isNightShift = shiftType === ShiftType.NIGHT_SHIFT || shiftType === ShiftType.TWENTY_FOUR_HOUR

        if (isDayShift && availability[dayOfWeek].day) {
          availabilityScore = 15
        } else if (isNightShift && availability[dayOfWeek].night) {
          availabilityScore = 15
        } else if (availability[dayOfWeek].day || availability[dayOfWeek].night) {
          availabilityScore = 10
        } else {
          availabilityScore = 0
        }
      }

      // Rating Match: 10%
      const ratingScore = c.totalReviews > 0 ? Math.min(10, (c.overallRating / 5) * 10) : 5

      // Verification Bonus: +15 points for verified caregivers (priority matching)
      const verificationBonus = c.isVerified ? 15 : 0

      const totalScore = skillScore + locationScore + experienceScore + availabilityScore + ratingScore + verificationBonus

      scored.push({
        id: c.id,
        userId: c.userId,
        city: c.city,
        skills: caregiverSkills,
        yearsExperience: c.yearsExperience,
        hourlyRate: c.hourlyRate,
        overallRating: c.overallRating,
        totalReviews: c.totalReviews,
        completedJobs: c.completedJobs,
        isVerified: c.isVerified,
        bio: c.bio,
        availabilityJson: availability,
        user: c.user as ScoredCaregiver['user'],
        matchScore: Math.round(totalScore * 10) / 10,
        scoreBreakdown: {
          skill: Math.round(skillScore * 10) / 10,
          location: Math.round(locationScore * 10) / 10,
          experience: Math.round(experienceScore * 10) / 10,
          availability: Math.round(availabilityScore * 10) / 10,
          rating: Math.round(ratingScore * 10) / 10,
        },
      })
    }

    scored.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({ results: scored, total: scored.length })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
