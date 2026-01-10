import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Cache Prisma client in ALL environments to prevent connection pool exhaustion
// This is especially important for serverless/Railway where many instances may be created
globalForPrisma.prisma = prisma

export default prisma
