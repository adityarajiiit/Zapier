import { prisma } from "@repo/prisma";

export const executionController={
    getAll:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflowId=request.query.workflowId
        const executions=await prisma.workflowExecution.findMany({
            where:workflowId?{workflowId}:undefined,
            orderBy:{
                createdAt:'desc'
            }
        })
        return executions
    },
    getExecution:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const execution=await prisma.workflowExecution.findUnique({
            where:{
                id:request.params.id
            },
            include:{
                stepResults:{
                    orderBy:{
                        stepOrder:'asc'
                    }
                }
            }
        })
        if(!execution){
            return reply.status(404).send({
                error:'execution not found'
            })
        }
        return execution
    }
    
}