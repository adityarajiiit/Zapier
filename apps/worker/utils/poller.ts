import { prisma } from "@repo/prisma"
import { integration } from "@repo/integrations"
import { getDecryptedCredential } from "@repo/oauth"
import { decrypt } from "@repo/crypto"
import { stepsQueue } from "@repo/queue"
import { Job } from "bullmq"

export const pollJob=async(job:Job<{
    workflowTriggerId:string
}>)=>{
    const {workflowTriggerId}=job.data
    const t=await prisma.workflowTrigger.findUnique({
        where:{
            id:workflowTriggerId
        },
        include:{
            trigger:{
                include:{
                    integration:true
                }
            },
            credential:true,
            workflow:{
                include:{
                    steps:{
                        where:{
                            isEnabled:true
                        },
                        orderBy:{
                            stepOrder:'asc'
                        }
                    }
                }
            }
        }
    })
    if(!t||!t.workflow.isActive){
        return
    }
    const tId=t.triggerId.replace(`${t.trigger.integrationId}-`,'')
    const handler=integration.getTrigger(t.trigger.integrationId,tId)
    if(!handler){
        return
    }
    let credentials:any
    if(t.credential){
        try{
           credentials=t.credential.authType==='OAUTH2'?await getDecryptedCredential(t.credential.id)
           :JSON.parse(await decrypt(t.credential.encryptedData))
        }
        catch(e:any){
            console.error(e.message)
            return
        }
    }
    const all=await handler({
        credentialData:credentials,
        config:t.config as any||{},
        lastFiredAt:t.lastFiredAt
    })
    for(const i of all){
        const firstStep=t.workflow.steps[0]||null
        const execution=await prisma.workflowExecution.create({
            data:{
                workflowId:t.workflowId,
                status:firstStep?'RUNNING':'COMPLETED',
                triggerData:i,
                startedAt:new Date(),
                finishedAt:firstStep?null:new Date(),
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
    }
        await prisma.workflowTrigger.update({
            where:{
                id:t.id
            },
            data:{
                lastFiredAt:new Date()
            }
        })    
}