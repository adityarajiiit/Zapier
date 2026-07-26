import { prisma } from "@repo/prisma"
import fastify from "fastify"
import cors from "@fastify/cors"
import { healthRoutes } from "./routes/health.js"
import workflowRoutes from "./routes/workflows.js"
import integrationRoutes from "./routes/integrations.js"
import executionRoutes from "./routes/executions.js"
import {credentialRoutes} from './routes/credentials.js'
import{oauthRoutes} from './routes/oauth.js'

import { integration } from "@repo/integrations"
const app=fastify()
app.addHook('onRequest',async(req:any)=>{
    if(req.headers['x-user-id']){
        req.user={
            id:req.headers['x-user-id']
        }
    }
})
await app.register(cors)

await healthRoutes(app)
await app.register(workflowRoutes,{prefix:'/workflows'})
await app.register(integrationRoutes,{prefix:'/integrations'})
await app.register(executionRoutes,{prefix:'/executions'})
await app.register(credentialRoutes,{prefix:'/credentials'})
await app.register(oauthRoutes,{prefix:'/oauth'})
await integration.seed()
app.listen({port:3000,host:'0.0.0.0'})