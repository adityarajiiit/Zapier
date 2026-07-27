import { prisma } from "@repo/prisma"
import { integration } from "@repo/integrations"
import { resolveInput } from "@repo/engine"
import { completeStep,failStep } from "@repo/engine"
import { getDecryptedCredential } from "@repo/oauth"
import { decrypt } from "@repo/crypto"
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

        let credential:any=null
        if(stepResult.workflowStep.credentialId){
            try{
                const cred=await prisma.credential.findUnique({
                    where:{id:stepResult.workflowStep.credentialId}
                })
                if(cred?.authType==='OAUTH2'){
                    credential=await getDecryptedCredential(stepResult.workflowStep.credentialId)
                }
                else if(cred?.authType==='APIKEY'||cred?.authType==='TOKEN'){
                    const decrypted=await decrypt(cred.encryptedData)
                    credential=JSON.parse(decrypted)
                }
            }
            catch(e:any){
                await prisma.$transaction(async(t:any)=>{
                    await failStep(t,stepResult.id,`credential decryp failed`+e.message,false)
                })
                return
            }
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
            inputData:input,
            credentialData:credential||undefined,
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
