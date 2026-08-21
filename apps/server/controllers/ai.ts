import { buildSystemPrompt, callGemini, fetchIntegrations, getAll, fields } from "../utils/ai.js"
import { prisma } from "@repo/prisma"
export const aiWorkflowController={
    generateWorkflow:async(request:any,reply:any)=>{
        const userId=request.userId
        if(!userId){
            return reply.status(400).send({
                error:'user id is required'
            })
        }
        const {prompt}=request.body
        if(!prompt?.trim()){
            return reply.status(400).send({
                error:'prompt is required'
            })
        }
        const integrations=await fetchIntegrations()
        const all=getAll(integrations)
        const systemPrompt=buildSystemPrompt(all)
        let raw:string
        try{
            raw=await callGemini(prompt.trim(),systemPrompt)
        }
        catch(e:any){
            return reply.status(500).send({
                error:e.message
            })
        }
        let parse:{
            name:string
            description?:string
            trigger?:{
                triggerId:string
                config:Record<string,any>
            }
            steps:Array<{
                actionId:string
                name:string
                input:Record<string,any>
            }>
        }
        try{
           parse=JSON.parse(raw)
        }
        catch(e:any){
            return reply.status(500).send({
                error:'failed to parse ai response'
            })
        }
        const allTriggerIds=new Set(integrations.flatMap(i=>i.triggers.map(t=>t.id)))
        const allActionIds=new Set(integrations.flatMap(i=>i.actions.map(a=>a.id)))
        if(parse.trigger&&!allTriggerIds.has(parse.trigger.triggerId)){
            return reply.status(400).send({
                error:'invalid triggerId'
            })
        }
        for(const step of parse.steps||[]){
            if(!allActionIds.has(step.actionId)){
                return reply.status(400).send({
                    error:'invalid actionId'
                })
            }
        }
        const workflow=await prisma.workflow.create({
            data:{
                userId,
                name:parse.name,
                description:parse.description||'',
            }
        })
        if(parse.trigger?.triggerId){
            await prisma.workflowTrigger.create({
                data:{
                    workflowId:workflow.id,
                    triggerId:parse.trigger.triggerId,
                    config:parse.trigger.config||{}
                }
            })
        }
        
        const createdSteps:Array<{id:string,name:string,stepOrder:number,input:Record<string,any>}>=[]
        for(let i=0;i<(parse.steps||[]).length;i++){
            const s=parse.steps[i]
            if(!s){
                continue
            }
            const step=await prisma.workflowStep.create({
                data:{
                    workflowId:workflow.id,
                    actionId:s.actionId,
                    name:s.name||'',
                    input:s.input||{},
                    stepOrder:i,
                    stepType:'ACTION',
                    isEnabled:true
                }
            })
            createdSteps.push({id:step.id,name:step.name||'',stepOrder:i,input:s.input||{}})
        }
        const requiredFields:Array<{
            stepId:string,
            stepName:string,
            stepOrder:number,
            fieldKey:string,
            fieldLabel:string
        }>=[]
        for(const step of createdSteps){
            for(const [k,v] of Object.entries(step.input)){
                if(v==='{{required}}'){
                    requiredFields.push({
                        stepId:step.id,
                        stepName:step.name,
                        stepOrder:step.stepOrder,
                        fieldKey:k,
                        fieldLabel:fields[k]?.label||k
                    })
                }
            }
        }
        return reply.send({
            workflowId:workflow.id,
            requiredFields
        })
    }
}