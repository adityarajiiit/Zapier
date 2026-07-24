import{prisma} from "@repo/prisma"
export const workflowController={
    newWorkflow:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const {name,description}=request.body
        const workflow=await prisma.workflow.create({
            data:{
                name,description,userId
            }
        })
        return workflow
    },
    getAll:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflows=await prisma.workflow.findMany({
            where:{
                userId
            },
            orderBy:{
                createdAt:'desc'
            }
        })
        return workflows
    },
    getWorkflow:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflow=await prisma.workflow.findUnique({
            where:{
                id:request.params.id
            },
            include:{
                trigger:true,
                steps:{
                    orderBy:{
                        stepOrder:'asc'
                    },
                    include:{
                        action:true
                    }
                }
            }
        })
        if(!workflow){
            return reply.status(404).send({
                error:'workflow not found'
            })
        }
        return workflow
    },
    updateWorkflow:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflow=await prisma.workflow.update({
            where:{
                id:request.params.id
            },
            data:{
                name:request.body.name,
                description:request.body.description
            }
        })
        return workflow
    },
    deleteWorkflow:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        await prisma.workflow.delete({
            where:{
                id:request.params.id
            }
        })
        return {success:true}
    },
    activateWorkflow:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflow=await prisma.workflow.update({
            where:{
                id:request.params.id
            },
            data:{
                isActive:true
            }
        })
        return workflow
    },
    deactivateWorkflow:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflow=await prisma.workflow.update({
            where:{
                id:request.params.id
            },
            data:{
                isActive:false
            }
        })
        return workflow
    },
    triggerWorkflow:async(request:any,reply:any)=>{
        const userId=request.user?.id
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflow=await prisma.workflow.findUnique({
            where:{
                id:request.params.id
            },
            include:{
                steps:{
                    orderBy:{
                        stepOrder:'asc'
                    }
                }
            }
        })
        if(!workflow){
            return reply.status(404).send({
                error:'workflow not found'
            })
        }
        const isCompleted=workflow.steps.length===0
        const execution=await prisma.workflowExecution.create({
            data:{
                workflowId:workflow.id,
                status:isCompleted?'COMPLETED':'RUNNING',
                triggerData:request.body.data||{},
                startedAt:new Date(),
                finishedAt:isCompleted?new Date():null,
                stepResults:{
                    create:workflow.steps.map(step=>({
                        workflowStepId:step.id,
                        stepOrder:step.stepOrder,
                        status:"PENDING",
                    }))
                }
            },
            include:{
                stepResults:true
            }
        })
        return execution
    }
}