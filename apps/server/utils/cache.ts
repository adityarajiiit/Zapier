import {redis} from '@repo/queue'



export const getCache=async(key:string)=>{
    const raw=await redis.get(key)
    if(!raw){
        return null
    }
    return JSON.parse(raw)
}

export const setCache=async(key:string,value:any)=>{
    await redis.set(key,JSON.stringify(value),'EX',3600*24)
}

export const delCache=async(...keys:string[])=>{
    if(keys.length>0){
        await redis.del(...keys)
    }
}
