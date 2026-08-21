import { prisma } from "@repo/prisma";
import { stepsQueue } from "@repo/queue"
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
        },
        include:{
            stepResults:true
        }
    })
    const firstStepResult=execution.stepResults?.[0]
    if(firstStepResult){
        await stepsQueue.add('execute-step',{
            stepResultId:firstStepResult.id
        },{attempts:5,backoff:{type:'exponential',delay:1000}})
    }
    return execution
}