import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export const env = envSchema.parse(process.env);