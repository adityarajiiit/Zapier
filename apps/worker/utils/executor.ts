import { prisma } from "@repo/prisma"
import { integration,checkRateLimit } from "@repo/integrations"
import { resolveInput, evaluateCondition, evaluateFilter,completeStep, failStep, skipRemainingSteps, buildContext, ConditionConfig } from "@repo/engine"
import { getDecryptedCredential } from "@repo/oauth"
import { decrypt } from "@repo/crypto"

export const executeStep=async(stepResult:any,workerId:string)=>{
    try{
        const step=stepResult.workflowStep
        const stepType=step.stepType||'ACTION'
        const ctx=await buildContext(stepResult.executionId)
        if(stepType==='FILTER'){
            const config=step.conditionConfig
            if(!config){
                throw new Error("config missing")
            }
            const passed=evaluateFilter(config,ctx as any)
            await prisma.$transaction(async(t)=>{
                if(!passed){
                    await skipRemainingSteps(t,stepResult.executionId,step.stepOrder)
                    await completeStep(t,stepResult.id,{passed,skippedRemaining:true})
                }
                else{
                    await completeStep(t,stepResult.id,{passed})
                }
            })
            return
        }

        if(stepType==='CONDITION'){
            const config=step.conditionConfig
            if(!config){
                throw new Error("config missing")
            }
            const passed=evaluateCondition(config,ctx as any)
            await prisma.$transaction(async(t)=>{
                if(!passed){
                    await skipRemainingSteps(t,stepResult.executionId,step.stepOrder)
                    await completeStep(t,stepResult.id,{passed,skippedRemaining:true})
                }
                else{
                    await completeStep(t,stepResult.id,{passed})
                }
            })
            return
        }

        if(stepType==='DELAY'){
            const delayMs=Number(step.input?.delayMs||0)
            if(delayMs>0){
                await new Promise((resolve)=>setTimeout(resolve,delayMs))
            }
            await prisma.$transaction(async(t)=>{
                await completeStep(t,stepResult.id,{delayMs})
            })
            return
        }

        const action=step.action
        const integrationId=action?.integrationId
        const actionId=action?.id
        const ActionId=actionId?.replace(`${integrationId}-`,'')||''
        const handler=integration.getAction(integrationId,ActionId)
        if(!handler){
            await prisma.$transaction(async(t)=>{
                await failStep(t,stepResult.id,`handler not found for ${action?.name}`,step.errorConfig)
            })
            return
        }
        const rateLimitConfig=await prisma.rateLimitConfig.findUnique({
            where:{
                integrationId:integrationId||''
            }
        })
        if(rateLimitConfig){
            const rl=await checkRateLimit(
                integrationId!,
                rateLimitConfig.period,
                rateLimitConfig.maxRequests
            )
            if(!rl.allowed){
                await prisma.stepResult.update({
                    where:{
                        id:stepResult.id
                    },
                    data:{
                        status:'PENDING',
                        startedAt:null,
                        error:`Rate limit exceeded`,
                        attemptNumber:{
                            decrement:1
                        }
                    }
                })
                return
            }
        }
        let credential:any=null
        if(step.credentialId){
            try{
                const cred=await prisma.credential.findUnique(
                    { 
                        where:{id:step.credentialId} 
                    })
                if(cred?.authType==='OAUTH2'){
                    credential=await getDecryptedCredential(step.credentialId)
                }
                else if(cred?.authType==='APIKEY'||cred?.authType==='TOKEN'){
                    const decrypted=await decrypt(cred.encryptedData)
                    credential=JSON.parse(decrypted)
                }
            }
            catch(e:any){
                await prisma.$transaction(async(t:any)=>{
                    await failStep(t,stepResult.id,e.message,step.errorConfig)
                })
                return
            }
        }

        const input=resolveInput(step.input||{},ctx.triggerData,ctx.stepOutputs)
        const actionContext={
            inputData:input,
            credentialData:credential||undefined,
            executionId:stepResult.executionId,
            stepResultId:stepResult.id
        }
        const result=(await handler(actionContext))||{}
        await prisma.$transaction(async(t)=>{
            await completeStep(t,stepResult.id,result)
        })
    }
    catch(e:any){
        await prisma.$transaction(async(t)=>{
            await failStep(t,stepResult.id,e.message,stepResult.workflowStep?.errorConfig)
        })
    }
}
