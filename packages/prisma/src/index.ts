import { PrismaClient } from '@prisma/client';
import{Pool} from 'pg'
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';
import { logger } from './logger.js';
import { createLogger } from './logger.js';
export { redis } from './redis.js';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const pool=new Pool({
  connectionString:env.DATABASE_URL,
  max:3,
  idleTimeoutMillis:30000,
  connectionTimeoutMillis:10000,
})
const adapter=new PrismaPg(pool)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.LOG_LEVEL === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { logger, createLogger };
export * from '@prisma/client';