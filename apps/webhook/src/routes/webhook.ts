import { FastifyInstance } from "fastify";
import { prisma } from "@repo/prisma";
import { verifyWebhook } from "../index.js";
import { createExecution } from "../processor.js";

export const webhookRoutes=async(app:FastifyInstance)=>{
    app.addContentTypeParser(
        'application/json',
        {parseAs:'buffer'},
        (req,body,done)=>done(null,body)
    )
    app.post('/:token',async(request,reply)=>{
        const{token}=request.params as{token:string}
        const body=request.body as Buffer
        let payload:any={}
        try{
           payload=JSON.parse(body.toString())
           if(payload.type==='url_verification'){
            return reply.send({challenge:payload.challenge})
           }
        }
        catch(e:any){
           return reply.status(400).send({
            error:'invalid json'
           })
        }
        const trigger=await prisma.workflowTrigger.findUnique({
            where:{
                webhookPath:token
            },
            include:{
                workflow:{
                    include:{
                        steps:{
                            where:{
                                isEnabled:true
                            },
                            orderBy:{
                                stepOrder:'asc'
                            },
                            select:{
                                id:true,
                                stepOrder:true
                            }
                        }
                    }
                },
                trigger:{
                    include:{
                        integration:true
                    }
                }
            }
        })
        if(!trigger){
            return reply.status(404).send({
                error:'not found'
            })
        }
        if(!trigger.workflow.isActive){
            return reply.status(200).send({
                skipped:'Workflow inactive'
            })
        }
        const webh=await prisma.webhook.create({
            data:{
                workflowTriggerId:trigger.id,
                payload,
                verified:false,
                statusCode:null
            }
        })
        const secret=trigger.webhookSecret
        const intName=trigger.trigger?.integration?.name||''
        const verified=secret?verifyWebhook(intName,body,request.headers,secret):true
        if(!verified){
            await prisma.webhook.update({
                where:{
                    id:webh.id
                },
                data:{
                    statusCode:400,
                    verified:false
                }
            })
            return reply.status(400).send({
                error:'verification failed'
            })
        }
        await prisma.webhook.update({
            where:{
                id:webh.id
            },
            data:{
                statusCode:200,
                verified:true
            }
        })
        const execution=await createExecution(
            trigger.workflowId,
            trigger.workflow.steps,
            payload
        )
        await prisma.webhook.update({
            where:{
                id:webh.id
            },
            data:{
                executionId:execution.id
            }
        })
        return reply.status(200).send({
            executionId:execution.id
        })
    })
}