import {prisma} from "@repo/prisma"
import {getCache,setCache} from "../utils/cache.js"
export const integrationController={
    getAll:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const cached=await getCache('integrations-all')
        if(cached) return cached
        const integrations=await prisma.integration.findMany({
            include:{
                triggers:true,
                actions:true
            }
        })
        await setCache('integrations-all',integrations)
        return integrations
    },
    getIntegration:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const cacheKey=`integrations-${request.params.id}`
        const cached=await getCache(cacheKey)
        if(cached) return cached
        const integrations=await prisma.integration.findUnique({
            where:{
                id:request.params.id
            },
            include:{
                triggers:true,
                actions:true
            }
        })
        if(!integrations){
            return reply.status(404).send({
                error:'integration not found'
            })
        }
        await setCache(cacheKey,integrations)
        return integrations
    }
}