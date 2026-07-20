import { PrismaClient } from '@prisma/client';

import { env } from './env.js';
import { logger } from './logger.js';
import { createLogger } from './logger.js';
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.LOG_LEVEL === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { logger, createLogger };
export type { Prisma } from '@prisma/client';