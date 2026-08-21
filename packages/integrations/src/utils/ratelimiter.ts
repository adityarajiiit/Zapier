import{redis} from '@repo/prisma'
export interface RateLimitResult{
    allowed:boolean
    retryTime?:number
    remaining?:number

}

export const checkRateLimit=async(
    integrationId:string,
    time:number,
    maxRequests:number
)=>{
    const index=Math.floor(Date.now()/time)
    const key=`ratelimit-${integrationId}-${index}`
    const count=await redis.incr(key)
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

