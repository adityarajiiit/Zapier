import pino from 'pino';

import { env } from './env.js';

export const logger = pino({ level: env.LOG_LEVEL });

export function createLogger(serviceName:string){
	return logger.child({service:serviceName})
}