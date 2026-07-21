import {prisma} from "@repo/prisma"
import fastify from "fastify"
import cors from "@fastify/cors"
import {healthRoutes} from "./routes/health"
import {dagsRoutes} from "./routes/dags"
const app=fastify()
await app.register(cors)
await healthRoutes(app)
await dagsRoutes(app)
app.listen({port:3000,host:'0.0.0.0'})