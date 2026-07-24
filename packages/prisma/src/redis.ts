import { Redis } from 'ioredis';

const globalForRedis=globalThis as typeof globalThis&{
  redis?:Redis
}

export const redis=
  globalForRedis.redis||
  new Redis(process.env.REDIS_URL as string,{
    retryStrategy:(times)=>Math.min(times*50,2000)
  })
if(process.env.NODE_ENV!=='production'){
  globalForRedis.redis = redis;
}

redis.on('connect',()=>{
  console.log('redis connected successfully');
})

redis.on('error',(e:any)=>{
  console.error(e.message);
})