import{redis} from '@repo/prisma'
export interface RateLimitResult{
    allowed:boolean
    retryAfter?:number
    remaining?:number
}

export const checkRateLimit=async(
    integrationId:string,
    time:number,
    maxRequests:number
):Promise<RateLimitResult>=>{
    const index=Math.floor(Date.now()/time)
    const key=`ratelimit-${integrationId}-${index}`
    const results=await redis.multi().incr(key).pexpire(key,time,'NX').exec()
    const count=Number(results?.[0]?.[1]||0)
    if(count>maxRequests){
        const ttlms=await redis.pttl(key)
        return{
            allowed:false,
            retryAfter:ttlms>0?ttlms:time,
            remaining:0
        }
    }
    return{
        allowed:true,
        remaining:maxRequests-count
    }
}
