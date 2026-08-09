import { prisma } from "@repo/prisma"
import fastify from "fastify"
import cors from "@fastify/cors"
import { healthRoutes } from "./routes/health.js"
import workflowRoutes from "./routes/workflows.js"
import integrationRoutes from "./routes/integrations.js"
import executionRoutes from "./routes/executions.js"
import { sseRoutes } from './routes/sse.js'
import {credentialRoutes} from './routes/credentials.js'
import{oauthRoutes} from './routes/oauth.js'

import { integration } from "@repo/integrations"
import { startScheduler } from "./scheduler/index.js"
import { stopScheduler } from "./scheduler/index.js"
import { verifyToken } from "./middleware/verifyToken.js"
const app=fastify()
app.addHook('onRequest',verifyToken)
await app.register(cors)

await healthRoutes(app)
await app.register(workflowRoutes,{prefix:'/workflows'})
await app.register(integrationRoutes,{prefix:'/integrations'})
await app.register(executionRoutes,{prefix:'/executions'})
await app.register(sseRoutes,{prefix:'/executions'})
await app.register(credentialRoutes,{prefix:'/credentials'})
await app.register(oauthRoutes,{prefix:'/oauth'})
await integration.seed()
startScheduler()
app.listen({port:3000,host:'0.0.0.0'})
process.on('SIGTERM',async()=>{
    await stopScheduler()
    process.exit(0)
})
process.on('SIGINT',async()=>{
    await stopScheduler()
    process.exit(0)
})