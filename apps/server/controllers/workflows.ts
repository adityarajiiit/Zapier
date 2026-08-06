import{prisma} from "@repo/prisma"
import { error } from "console"
import crypto from 'crypto'
import { request } from "http"
export const workflowController={
    newWorkflow:async(request:any,reply:any)=>{
        const userId=request.userId
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
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflows=await prisma.workflow.findMany({
            where:{
                userId
            },
            orderBy:{
                createdAt:'desc'
            },
            include:{
                steps:true
            }
        })
        return workflows
    },
    getWorkflow:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflow=await prisma.workflow.findUnique({
            where:{
                id:request.params.id
            },
            include:{
                trigger:{
                    include:{
                        trigger:true
                    }
                },
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
        const mappedWorkflow={
            ...workflow,
            trigger:workflow.trigger?{
                ...workflow.trigger,
                integrationId:workflow.trigger.trigger?.integrationId
            }:null,
            steps:workflow.steps.map(s=>({
                ...s,
                integrationId:s.action?.integrationId
            }))
        }
        return mappedWorkflow
    },
    updateWorkflow:async(request:any,reply:any)=>{
        const userId=request.userId
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
        const userId=request.userId
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
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const trigger=await prisma.workflowTrigger.findUnique({
            where:{
                workflowId:request.params.id
            },
            include:{
                trigger:{
                    include:{
                        integration:true
                    }
                },
                credential:true
            }
        })
        let path=trigger?.webhookPath
        let secret=trigger?.webhookSecret
        if(trigger&& trigger.trigger?.triggerType==='WEBHOOK'&&!trigger.webhookPath){
            path=`/${crypto.randomUUID().replace(/-/g,'').slice(0,16)}`
            secret=crypto.randomBytes(32).toString('hex')
            await prisma.workflowTrigger.update({
                where:{
                    workflowId:request.params.id
                },
                data:{
                    webhookPath:path,
                    webhookSecret:secret
                }
            })
        }
        if(trigger?.trigger?.integration?.name==='GitHub'&&path&&secret){
            const config=trigger.config as any||{}
            const repo=config.repo as string
            if(repo&&trigger.credential?.encryptedData&&!config.githubWebhookId){
                const{decrypt}=await import('@repo/crypto')
                const decryptedStr=await decrypt(trigger.credential.encryptedData)
                const credData=JSON.parse(decryptedStr)
                const token=credData.accessToken
                if(token){
                    const baseUrl=process.env.WEBHOOK_URL
                const webhookUrl=`${baseUrl}/webhooks${path}`
                const res=await fetch(`https://api.github.com/repos/${repo}/hooks`,{
                    method:'POST',
                    headers:{
                        'Accept':'application/vnd.github.v3+json',
                        'Authorization':`Bearer ${token}`,
                        'Content-Type':'application/json'
                    },
                    body:JSON.stringify({
                        name:'web',
                        active:true,
                        events:['push','issues','pull_request','watch','issue_comment'],
                        config:{
                            url:webhookUrl,
                            content_type:'json',
                            secret:secret,
                            insecure_ssl:'0'
                        }
                    })
                })
                if(res.ok){
                    const data=await res.json()
                    await prisma.workflowTrigger.update({
                        where:{id:trigger.id},
                        data:{
                            config:{
                                ...config,
                                githubWebhookId:data.id
                            }
                        }
                    })
                }
                }
            }
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
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const trigger=await prisma.workflowTrigger.findUnique({
            where:{
                workflowId:request.params.id
            },
            include:{
                trigger:{
                    include:{
                        integration:true
                    }
                },
                credential:true
            }
        })
        if(trigger?.trigger?.integration?.name==='GitHub'){
            const config=trigger.config as any||{}
            const repo=config.repo as string
            const hookId=config.githubWebhookId
            if(repo&&hookId&&trigger.credential?.encryptedData){
                const{decrypt}=await import('@repo/crypto')
                const decryptedStr=await decrypt(trigger.credential.encryptedData)
                const credData=JSON.parse(decryptedStr)
                const token=credData.accessToken
                if(token){
                    const res=await fetch(`https://api.github.com/repos/${repo}/hooks/${hookId}`,{
                        method:'DELETE',
                        headers:{
                            'Accept':'application/vnd.github.v3+json',
                            'Authorization':`Bearer ${token}`
                        }
                    })
                    if(res.ok||res.status===404){
                        await prisma.workflowTrigger.update({
                            where:{id:trigger.id},
                            data:{
                                config:{
                                    ...config,
                                    githubWebhookId:null
                                }
                            }
                        })
                    }
                }
            }
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
        const userId=request.userId
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
        const firstStep=workflow.steps.length>0?workflow.steps[0]:null
        const execution=await prisma.workflowExecution.create({
            data:{
                workflowId:workflow.id,
                status:isCompleted?'COMPLETED':'RUNNING',
                triggerData:request.body?.data||{},
                startedAt:new Date(),
                finishedAt:isCompleted?new Date():null,
                stepResults:firstStep?{
                    create:[{
                        workflowStepId:firstStep.id,
                        stepOrder:firstStep.stepOrder,
                        status:"PENDING",
                    }]
                }:undefined
            },
            include:{
                stepResults:true
            }
        })
        return execution
    },
    addStep:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({
                error:'userId is required'
            })
        }
        const workflowId=request.params.id
        const workflow=await prisma.workflow.findUnique({
            where:{
                id:workflowId,
                userId
            }
        })
        if(!workflow){
            return reply.status(404).send({
                error:'workflow not found'
            })
        }
        const{stepType,actionId,name,input,conditionConfig,errorConfig}=request.body
        const maxStep=await prisma.workflowStep.findFirst({
            where:{
                workflowId
            },
            orderBy:{
                stepOrder:'desc'
            }
        })
        const step=await prisma.workflowStep.create({
            data:{
                workflowId,
                stepType:stepType||'ACTION',
                actionId:actionId||null,
                name:name||'',
                input:input||{},
                conditionConfig:conditionConfig||null,
                errorConfig:errorConfig||null,
                stepOrder:maxStep?maxStep.stepOrder+1:0,
                isEnabled:true
            }
        })
        return step
    },
    updateStep:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({
                error:'userId is required'
            })
        }
        const{stepType,actionId,name,input,conditionConfig,errorConfig,isEnabled}=request.body
        const step=await prisma.workflowStep.update({
            where:{
                id:request.params.stepId
            },
            data:{
                stepType:stepType,
                actionId:actionId,
                name:name,
                input:input,
                conditionConfig:conditionConfig,
                errorConfig:errorConfig,
                isEnabled:isEnabled
            }
        })
        return step
    },
    deleteStep:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({
                error:'userId is required'
            })
        }
        const{stepId}=request.params
        const workflowId=request.params.id
        await prisma.$transaction(async(t)=>{
            await t.workflowStep.delete({
                where:{
                    id:stepId
                }
            })
            const remainingSteps=await t.workflowStep.findMany({
                where:{
                    workflowId
                },
                orderBy:{
                    stepOrder:'asc'
                }
            })
            for(let i=0;i<remainingSteps.length;i++){
                if(remainingSteps[i]?.stepOrder!==i){
                    await t.workflowStep.update({
                        where:{
                            id:remainingSteps[i]?.id||''
                        },
                        data:{
                            stepOrder:i
                        }
                    })
                }
            }
        })
        return {success:true}
    },

    reorderSteps:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({
                error:'userId is required'
            })
        }
        const steps=request.body
        await prisma.$transaction(
            steps.map((step:any)=>{
                prisma.workflowStep.update({
                    where:{
                        id:step.id
                    },
                    data:{
                        stepOrder:step.stepOrder
                    }
                })
            })
        )
        return {success:true}
    },
    regenerateWebhook:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({
                error:'user id required'
            })
        }
        const workflow=await prisma.workflowTrigger.findUnique({
            where:{
                workflowId:request.params.id
            },
            include:{
                trigger:true
            }
        })
        if(!workflow){
            return reply.status(404).send({
                error:'workflow not found'
            })
        }
        if(!workflow.trigger){
            return reply.status(404).send({
                error:'trigger not found'
            })
        }
        const newSecret=crypto.randomBytes(32).toString('hex')
        const updated=await prisma.workflowTrigger.update({
            where:{
                workflowId:workflow.id
            },
            data:{
                webhookSecret:newSecret
            }
        })
        return {
            webhookSecret:newSecret,
            webhookPath:updated.webhookPath
        }
    },
    syncWorkflow:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({error:'userId is required'})
        }
        const workflowId=request.params.id
        const{trigger,steps}=request.body
        await prisma.$transaction(async(t)=>{
            if(trigger?.triggerId){
                await t.workflowTrigger.upsert({
                    where:{workflowId},
                    update:{
                        triggerId:trigger.triggerId,
                        credentialId:trigger.credentialId||null,
                        config:trigger.config||{}
                    },
                    create:{
                        workflowId,
                        triggerId:trigger.triggerId,
                        credentialId:trigger.credentialId||null,
                        config:trigger.config||{}
                    }
                })
            }
            const payloadIds=(steps||[]).map((s:any)=>s.id)
            await t.workflowStep.deleteMany({
                where:{
                    workflowId,
                    id:{notIn:payloadIds}
                }
            })
            for(const step of (steps||[])){
                await t.workflowStep.upsert({
                    where:{id:step.id},
                    update:{
                        actionId:step.actionId||null,
                        credentialId:step.credentialId||null,
                        stepOrder:step.stepOrder,
                        name:step.name||'',
                        input:step.input||{},
                        stepType:step.stepType||'ACTION',
                        conditionConfig:step.conditionConfig||null,
                        errorConfig:step.errorConfig||null,
                        isEnabled:true
                    },
                    create:{
                        id:step.id,
                        workflowId,
                        actionId:step.actionId||null,
                        credentialId:step.credentialId||null,
                        stepOrder:step.stepOrder,
                        name:step.name||'',
                        input:step.input||{},
                        stepType:step.stepType||'ACTION',
                        conditionConfig:step.conditionConfig||null,
                        errorConfig:step.errorConfig||null,
                        isEnabled:true
                    }
                })
            }
        })
        return reply.send({success:true})
    },
    getWebhook:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({
                error:'userId is required'
            })
        }
        const workflow=await prisma.workflow.findUnique({
            where:{
                id:request.params.id,
                userId
            }
        })
        if(!workflow){
            return reply.status(404).send({
                error:'workflow not found'
            })
        }
        const web=await prisma.webhook.findMany({
            where:{
                workflowTrigger:{
                    workflowId:request.params.id
                }
            },
            orderBy:{
                createdAt:'desc'
            },
            take:10,
            
        })
        return reply.send(web)
    }

}