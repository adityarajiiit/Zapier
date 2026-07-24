import {prisma} from "@repo/prisma"
export const integrationController={
    getAll:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const integrations=await prisma.integration.findMany({
            include:{
                triggers:true,
                actions:true
            }
        })
        return integrations
    },
    getIntegration:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
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
        return integrations
    }
}