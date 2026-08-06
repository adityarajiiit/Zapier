import { prisma } from "@repo/prisma";

export const createExecution=async(workflowId:string,steps:{
    id:string,
    stepOrder:number
}[],triggerData:any)=>{
    const isCompleted=steps.length===0
    const firstStep=steps[0]||null
    const execution=await prisma.workflowExecution.create({
        data:{
            workflowId,
            status:isCompleted?'COMPLETED':'RUNNING',
            triggerData,
            startedAt:new Date(),
            finishedAt:isCompleted?new Date():null,
            stepResults:firstStep?{
                create:[{
                    workflowStepId:firstStep.id,
                    stepOrder:firstStep.stepOrder,
                    status:'PENDING'
                }]
            }:undefined
        }
    })
    return execution
}