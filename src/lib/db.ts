import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Check multiple env var names for Turso connection
  const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || ''

  if (dbUrl && dbUrl.startsWith('libsql://')) {
    const adapter = new PrismaLibSql({ url: dbUrl, authToken })
    return new PrismaClient({ adapter })
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[DB] No Turso DATABASE_URL found, using local SQLite')
  }
  return new PrismaClient()
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
