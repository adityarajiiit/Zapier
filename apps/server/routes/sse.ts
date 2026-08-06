import{prisma} from"@repo/prisma"
import{FastifyInstance} from "fastify"

export const sseRoutes=async(app:FastifyInstance)=>{
    app.get('/:id/stream',async(request:any,reply:any)=>{
        const{id}=request.params
        reply.raw.setHeader('Content-Type','text/event-stream')
        reply.raw.setHeader('Cache-Control','no-cache')
        reply.raw.setHeader('Connection','keep-alive')
        reply.raw.flushHeaders()
        
        const send=(event:string,data:object)=>{
            reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        }
        let closed=false
        request.raw.on('close',()=>{
            closed=true
        })
        const poll=setInterval(async()=>{
            if(closed){
                clearInterval(poll)
                return
            }
            const exec=await prisma.workflowExecution.findUnique({
                where:{
                    id
                },
                include:{
                    stepResults:{
                        orderBy:{
                            stepOrder:'asc'
                        }
                    }
                }
            })
            if(!exec){
                clearInterval(poll)
                reply.raw.end()
                return
            }
            send('update',exec)
            if(['COMPLETED','FAILED','CANCELLED'].includes(exec.status)){
                clearInterval(poll)
                send('done',{
                    status:exec.status
                })
                reply.raw.end()
            }
        },1000)
        await new Promise<void>((r)=>request.raw.on('close',r))
    })
}