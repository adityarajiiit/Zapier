import { prisma } from "@repo/prisma"
import { integration } from "@repo/integrations"
import { resolveInput } from "@repo/engine"
import { completeStep,failStep } from "@repo/engine"

export const executeStep=async(stepResult:any,workerId:string)=>{
    try{
        const action=stepResult.workflowStep.action
        const integrationId=action.integrationId
        const actionId=action.id
        const handler=integration.getAction(integrationId,actionId)
        
        if(!handler){
            await prisma.$transaction(async(t)=>{
                await failStep(t,stepResult.id,`handler not found for ${action.name}`,false)
            })
            return
        }

        let credential=null
        if(stepResult.workflowStep.credential?.data){
            credential=JSON.parse(stepResult.workflowStep.credential.data)
        }

        const completedSteps=await prisma.stepResult.findMany({
            where:{
                executionId:stepResult.executionId,
                status:'COMPLETED'
            },
            include:{
                workflowStep:true
            }
        })
        const previousOutputs:Record<string,any>={}
        for(const step of completedSteps){
            const stepName=step.workflowStep.name||`step-${step.stepOrder}`
            previousOutputs[stepName]=step.output
        }
        const input=resolveInput(
            stepResult.workflowStep.input,
            stepResult.execution.triggerData, 
            previousOutputs
        )

        const actionContext={
            input,
            credentials:credential,
            executionId:stepResult.executionId,
            stepResultId:stepResult.id
        }

        const result=await handler(actionContext)||{}

        await prisma.$transaction(async(t)=>{
            await completeStep(t,stepResult.id,result)
        })
    }
    catch(e:any){
        await prisma.$transaction(async(t)=>{
            await failStep(t,stepResult.id,e.message,false)
        })
    }
}
