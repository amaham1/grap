// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma Client instances in development hot-reloads
// https://pris.ly/d/help/next-js-best-practices
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
