import{FastifyInstance} from "fastify"
import{prisma} from "@repo/prisma"
import{verifySlack} from "../verification/slack.js"
import{createExecution} from "../processor.js"

export const slackRoutes=async(app:FastifyInstance)=>{
    app.addContentTypeParser(
        'application/json',
        {parseAs:'buffer'},
        (req,body,done)=>done(null,body)
    )
    app.post('/',async(request,reply)=>{
        const body=request.body as Buffer
        let payload:any={}
        try{
            payload=JSON.parse(body.toString())
            if(payload.type==='url_verification'){
                return reply.send({challenge:payload.challenge})
            }
        }
        catch(e:any){
            return reply.status(400).send({error:'invalid json'})
        }
        const event=payload.event||payload
        const eventType=event.type as string
        const triggers=await prisma.workflowTrigger.findMany({
            where:{
                trigger:{
                    integration:{
                        name:'Slack'
                    },
                    triggerType:'WEBHOOK'
                },
                workflow:{
                    isActive:true
                }
            },
            include:{
                workflow:{
                    include:{
                        steps:{
                            where:{isEnabled:true},
                            orderBy:{stepOrder:'asc'},
                            select:{id:true,stepOrder:true}
                        }
                    }
                },
                trigger:true
            }
        })
        const matched=triggers.filter(t=>t.trigger.id===eventType||t.trigger.id==='new-message'&&eventType==='message'||t.trigger.id==='mention'&&eventType==='app_mention'||t.trigger.id==='new-reaction'&&eventType==='reaction_added'||t.trigger.id==='new-channel'&&eventType==='channel_created')
        if(matched.length===0){
            return reply.status(200).send({ok:true})
        }
        const sig=request.headers['x-slack-signature'] as string
        const ts=request.headers['x-slack-request-timestamp'] as string
        const executions:string[]=[]
        for(const trigger of matched){
            const secret=process.env.SLACK_SIGNING_SECRET
            if(secret&&!verifySlack(body,sig,ts,secret)){
                continue
            }
            const webh=await prisma.webhook.create({
                data:{
                    workflowTriggerId:trigger.id,
                    payload,
                    verified:true,
                    statusCode:200
                }
            })
            const execution=await createExecution(
                trigger.workflowId,
                trigger.workflow.steps,
                event
            )
            await prisma.webhook.update({
                where:{id:webh.id},
                data:{executionId:execution.id}
            })
            executions.push(execution.id)
        }
        return reply.status(200).send({executionIds:executions})
    })
}
