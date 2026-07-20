import {prisma} from "@repo/prisma"
import fastify from "fastify"

const app=fastify({
    logger:{
        level:'info',
    }
})

app.get('/',async(request,reply)=>{
    reply.send({message:'Hello, World!'})
})

app.listen({port:3000,host:'0.0.0.0'})