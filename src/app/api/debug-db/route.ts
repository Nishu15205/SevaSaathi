import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const results: Record<string, string> = {}
    results.DATABASE_URL = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET'
    results.DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN ? 'SET (len=' + process.env.DATABASE_AUTH_TOKEN.length + ')' : 'NOT SET'
    results.NODE_ENV = process.env.NODE_ENV || 'NOT SET'

    // Try to import and create DB
    try {
      const { db } = await import('@/lib/db')
      results.db_created = 'ok'
      
      // Try a simple query
      const count = await db.user.count()
      results.user_count = String(count)
      
      const caregiverCount = await db.caregiver.count()
      results.caregiver_count = String(caregiverCount)
      
      results.status = 'SUCCESS'
    } catch (e: unknown) {
      results.db_error = e instanceof Error ? e.message : String(e)
      results.status = 'DB_ERROR'
    }

    return NextResponse.json(results)
  } catch (e: unknown) {
    return NextResponse.json({
      status: 'FATAL',
      error: e instanceof Error ? e.message : String(e),
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN ? 'SET' : 'NOT SET',
      }
    }, { status: 500 })
  }
}
