import { prisma } from "@repo/prisma"
import fastify from "fastify"
import cors from "@fastify/cors"
import rateLimit from "@fastify/rate-limit"
import { healthRoutes } from "./routes/health.js"
import workflowRoutes from "./routes/workflows.js"
import integrationRoutes from "./routes/integrations.js"
import executionRoutes from "./routes/executions.js"
import { sseRoutes } from './routes/sse.js'
import {credentialRoutes} from './routes/credentials.js'
import{oauthRoutes} from './routes/oauth.js'

import { integration } from "@repo/integrations"

import { verifyToken } from "./middleware/verifyToken.js"
const app=fastify()
app.addHook('onRequest',verifyToken)
await app.register(cors,{origin:process.env.WEB_URL||false,credentials:true})
await app.register(rateLimit,{max:100,timeWindow:'1 minute',keyGenerator:(req:any)=>req.userId||req.ip})

await healthRoutes(app)
await app.register(workflowRoutes,{prefix:'/workflows'})
await app.register(integrationRoutes,{prefix:'/integrations'})
await app.register(executionRoutes,{prefix:'/executions'})
await app.register(sseRoutes,{prefix:'/executions'})
await app.register(credentialRoutes,{prefix:'/credentials'})
await app.register(oauthRoutes,{prefix:'/oauth'})
await integration.seed()
app.listen({port:3000,host:'0.0.0.0'})
process.on('SIGTERM',()=>{
    process.exit(0)
})
process.on('SIGINT',()=>{
    process.exit(0)
})