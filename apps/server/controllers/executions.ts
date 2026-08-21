import { prisma } from "@repo/prisma";

export const executionController={
    getAll:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflowId=request.query.workflowId
        const executions=await prisma.workflowExecution.findMany({
            where:{
                workflow:{userId},
                ...(workflowId?{workflowId}:{})
            },
            orderBy:{
                createdAt:'desc'
            },
            include:{
                stepResults:true
            }
        })
        return executions
    },
    getExecution:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const execution=await prisma.workflowExecution.findUnique({
            where:{
                id:request.params.id
            },
            include:{
                workflow:{
                    select:{userId:true}
                },
                stepResults:{
                    orderBy:{
                        stepOrder:'asc'
                    }
                }
            }
        })
        if(!execution||execution.workflow.userId!==userId){
            return reply.status(403).send({
                error:'forbidden'
            })
        }
        return execution
    }
    
}