import { z } from "zod"
import {FastifyInstance} from "fastify"
import {prisma} from "@repo/prisma"
import { dagsController } from "../controllerts/dags.controller"
const dagsSchema=z.object({
    name:z.string().min(1),
    description:z.string().optional(),
    tasks:z.array(z.object({
        name:z.string().min(1),
        handler:z.string().min(1),
        retry:z.object({
            maxAttempts:z.number().int().min(1),
            backoff:z.number().int().min(0)
        }),
    })).min(1),
    edges:z.array(z.object({
        from:z.string().min(1),
        to:z.string().min(1)
    }))
})

export const dagsRoutes=async(app:FastifyInstance)=>{
    app.post('/dags',async(request,reply)=>{
        return dagsController.createDag(request,reply)
    })
    app.post('/dagrun',async(request,reply)=>{
        return dagsController.runDag(request,reply)
    })
    app.get('/dagrun/:id',async(request,reply)=>{
        return dagsController.getDagRun(request,reply)
    })
}

