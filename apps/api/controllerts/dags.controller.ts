import { z } from "zod"
import {prisma} from "@repo/prisma"
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

const dagRunSchema=z.object({
    dagId:z.string().min(1),
    input:z.record(z.string(),z.any()).optional()
})
export const dagsController={
    createDag:async(request:any,reply:any)=>{
        const parsed=dagsSchema.safeParse(request.body)
        if(!parsed.success){
            return reply.status(400).send({
                status:'error',
                message:'not in proper format'
            })
        }
        const {name,description,tasks,edges}=parsed.data
        for(const i of edges){
            const ftask=tasks.some(task=>task.name===i.from)
            const ttask=tasks.some(task=>task.name===i.to)
            if(!ftask||!ttask){
                return reply.status(400).send({
                    status:'error',
                    message:'tasks in edges not found in tasks'
                })
            }
        }
        const indegree=new Map<string,number>()
        const graph=new Map<string,string[]>()
        for(const task of tasks){
            indegree.set(task.name,0)
            graph.set(task.name,[])
        }
        for(const edge of edges){
            indegree.set(edge.to,(indegree.get(edge.to)||0)+1)
            graph.get(edge.from)?.push(edge.to)
        }
        const queue:string[]=[]
        indegree.forEach((deg, task) => {
            if(deg===0){
                queue.push(task)
            }
        })
        let count=0
        while(queue.length>0){
            const task=queue.shift()!
            count++
            for(const neighbor of graph.get(task)||[]){
                indegree.set(neighbor,(indegree.get(neighbor)||0)-1)
                if(indegree.get(neighbor)===0){
                    queue.push(neighbor)
                }
            }
        }
        if(count!==tasks.length){
            return reply.status(400).send({
                status:'error',
                message:'cycle detected in tasks'
            })
        }
        const dag=await prisma.$transaction(async(t)=>{
            const dag=await t.dag.create({
                data:{
                    name,
                    description,
                }
            })
            await t.taskNode.createMany({
                data:tasks.map(task=>({
                    name:task.name,
                    handler:task.handler,
                    retry:task.retry,
                    dagId:dag.id
                }))
            })
            const node=await t.taskNode.findMany({
                where:{
                    dagId:dag.id
                }
            })
            const nameToId=new Map(node.map(n=>[n.name,n.id]))
            await t.taskEdge.createMany({
                data:edges.map(edge=>({
                    parentTaskId:nameToId.get(edge.from)!,
                    childTaskId:nameToId.get(edge.to)!,
                    dagId:dag.id
                }))
            })
            return dag
        })
        return reply.send({
            status:'ok',
            data:dag
        })
    },
    runDag:async(request:any,reply:any)=>{
        const parsed=dagRunSchema.safeParse(request.body)
        if(!parsed.success){
            return reply.status(400).send({
                status:'error',
                message:'not in proper format'
            })
        }
        const {dagId,input}=parsed.data
        const dagRun=await prisma.$transaction(async(t)=>{
            const dag=await t.dag.findUnique({
                where:{
                    id:dagId
                },
                include:{
                    taskNodes:{
                        include:{
                            childEdges:true,
                        }
                    }
                }
            })
            if(!dag){
                throw new Error('dag not found')
            }
            const inDegree=new Map<string,number>()
            for(const task of dag.taskNodes){
                inDegree.set(task.id,0)
            }
            for(const task of dag.taskNodes){
                for(const edge of task.childEdges){
                    const c=inDegree.get(edge.childTaskId)||0
                    inDegree.set(edge.childTaskId,c+1)
                }
            }
            const dagRun=await t.dagRun.create({
                data:{
                    dagId:dag.id,
                    status:'RUNNING',
                    input:input||{},
                    startedAt:new Date()
                }
            })
            await t.taskInstance.createMany({
                data:dag.taskNodes.map(task=>({
                    dagRunId:dagRun.id,
                    taskNodeId:task.id,
                    remainingDependencies:inDegree.get(task.id)||0,
                    status:(inDegree.get(task.id)||0)===0?'READY':'WAITING',
                }))
            })
            return dagRun
        })
        return reply.send({
            status:'ok',
            data:dagRun
        })
    },
    getDagRun:async(request:any,reply:any)=>{
        const dagRunId=request.params.id
        const dagRun=await prisma.dagRun.findUnique({
            where:{
                id:dagRunId
            },
            include:{
                taskInstances:{
                    include:{
                        taskNode:{
                            select:{
                                name:true,
                                handler:true
                            }
                        }
                    },
                    orderBy:{
                        startedAt:'asc'
                    }
                }
            }
        })
        if(!dagRun){
            return reply.status(404).send({
                status:'error',
                message:'dag run not found'
            })
        }
        return reply.send({
            status:'ok',
            data:dagRun
        })
    },
    
}