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
        const matched=triggers.filter(t=>
            (t.trigger.id==='slack-new-message'&&eventType==='message')||
            (t.trigger.id==='slack-mention'&&eventType==='app_mention')||
            (t.trigger.id==='slack-new-reaction'&&eventType==='reaction_added')||
            (t.trigger.id==='slack-new-channel'&&eventType==='channel_created')
        )
        if(matched.length===0){
            return reply.status(200).send({ok:true})
        }
        const sig=request.headers['x-slack-signature'] as string
        const ts=request.headers['x-slack-request-timestamp'] as string
        const executions:string[]=[]
        const secret=process.env.SLACK_SIGNING_SECRET
        if(!secret){
            return reply.status(500).send({error:'no slack signing secret'})
        }
        if(!verifySlack(body,sig,ts,secret)){
            return reply.status(401).send({error:'invalid signature'})
        }
        for(const trigger of matched){
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
