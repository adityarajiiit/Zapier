import {prisma} from "@repo/prisma"
import {FastifyInstance} from "fastify"
export const healthRoutes=async(app:FastifyInstance)=>{
    app.get('/health',async(request,reply)=>{
        try{
            await prisma.$queryRaw`SELECT 1`
            reply.send({status:'ok'})
        }
        catch(e){
            reply.status(500).send({status:'error',message:'Database not connected'})
        }
    })
}