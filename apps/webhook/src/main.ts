import fastify from "fastify";
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { webhookRoutes } from "./routes/webhook.js";
import { slackRoutes } from "./routes/slack.js";
import { prisma } from "@repo/prisma";

const app=fastify({
    logger:true
})

await app.register(cors as any,{origin:process.env.WEB_URL||false,credentials:true})
await app.register(rateLimit as any,{max:50,timeWindow:'1 minute',keyGenerator:(req:any)=>req.ip})
await app.register(webhookRoutes,{
    prefix:'/webhooks'
})
await app.register(slackRoutes,{
    prefix:'/slack'
})

app.get('/oauth/callback',(request:any,reply:any)=>{
    const query=new URLSearchParams(request.query).toString()
    reply.redirect(`${process.env.SERVER_URL}/oauth/callback?${query}`)
})

const shutdown=async()=>{
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
}

process.on('SIGINT',shutdown)
process.on('SIGTERM',shutdown)

app.listen({
    port:3002,
    host:'0.0.0.0'
})

console.log('webhook running on 3002')