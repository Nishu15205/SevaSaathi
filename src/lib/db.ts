import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  // If URL starts with "libsql://", use Turso cloud adapter
  if (dbUrl.startsWith('libsql://')) {
    const authToken = process.env.DATABASE_AUTH_TOKEN
    const libsql = createClient({
      url: dbUrl,
      authToken: authToken,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter, log: ['query'] })
  }

  // Otherwise use local SQLite (dev or Docker with file: URL)
  return new PrismaClient({
    log: ['query'],
  })
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
