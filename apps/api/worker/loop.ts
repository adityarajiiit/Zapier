import {prisma} from "@repo/prisma"
import {handlers} from "./index.ts"
const completeTask=async(task:any,result:any)=>{
    await prisma.$transaction(async(t:any)=>{
        await t.taskInstance.update({
            where:{
                id:task.id
            },
            data:{
                status:"COMPLETED",
                result:result,
                finishedAt:new Date()
            }
        })
        const childEdges=await t.taskEdge.findMany({
            where:{
                parentTaskId:task.taskNodeId
            }
        })
        const childTaskNodeIds=childEdges.map((e:any)=>e.childTaskId)
        if(childTaskNodeIds.length>0){
            await t.$executeRaw`
            UPDATE task-instances
            SET
                remaining-dependencies=remaining-dependencies-1
                status=CASE
                  WHEN remaining-dependencies-1=0 THEN 'READY'::'TaskInstanceEnum'
                  ELSE status
                END
            WHERE dag-run-id=${task.dagRunId} AND task-node-id=ANY(${childTaskNodeIds}::uuid[])
            `
        }
        const remaining=await t.taskInstance.count({
            where:{
                dagRunId:task.dagRunId,
                status:{
                    notIn:["COMPLETED","FAILED"]
                }
            }
        })
        if(remaining===0){
            const anyFailed=await t.taskInstance.count({
                where:{
                    dagRunId:task.dagRunId,
                    status:"FAILED"
                }
            })
            await t.dagRun.update({
                where:{
                    id:task.dagRunId
                },
                data:{
                    status:anyFailed>0?"FAILED":"COMPLETED",
                    finishedAt:new Date()
                }
            })
        }
    })
}
const failTask=async(task:any,error:string)=>{
    await prisma.$transaction(async(t:any)=>{
        await t.taskInstance.update({
            where:{
                id:task.id
            },
            data:{
                status:"FAILED",
                error:error,
                finishedAt:new Date()
            }
        })
        await t.$executeRaw`
        WITH RECURSIVE downstream AS (
            SELECT child-task-id FROM task-edges WHERE parent-task-id=${task.taskNodeId}::uuid
            UNION
            SELECT te.child-task-id FROM task-edges te
            JOIN downstream d ON te.parent-task-id=d.child-task-id
        )
        UPDATE task-instances
        SET status='FAILED'::"TaskInstanceEnum",error="upstream task failed"
        WHERE dag-run-id=${task.dagRunId}::uuid
           AND task-node-id IN (SELECT child-task-id FROM downstream)
           AND status IN ('WAITING'::'TaskInstanceEnum','READY'::'TaskInstanceEnum')
        `
        const remaining=await t.taskInstance.count({
            where:{
                dagRunId:task.dagRunId,
                status:{
                    notIn:["COMPLETED","FAILED"]
                }
            }
        })
        if(remaining===0){
            const anyFailed=await t.taskInstance.count({
                where:{
                    dagRunId:task.dagRunId,
                    status:"FAILED"
                }
            })
            await t.dagRun.update({
                where:{
                    id:task.dagRunId
                },
                data:{
                    status:anyFailed>0?"FAILED":"COMPLETED",
                    finishedAt:new Date()
                }
            })  
        }
    })
}
const loop=async()=>{
    const task=await prisma.taskInstance.findFirst({
        where:{
            status:"READY",
            remainingDependencies:0
        },
        include:{
            taskNode:true,
            dagRun:true
        },
        orderBy:{
            dagRunId:"asc"
        }
    })
    if(!task){
        return
    }
    await prisma.taskInstance.update({
        where:{
            id:task.id
        },
        data:{
            status:"RUNNING",
            startedAt:new Date(),
            attempts:{increment:1}
        }
    })
    const handler=handlers.get(task.taskNode.handler)
    if(!handler){
        await failTask(task,'handler not found')
        return
    }
    try{
        const result=await handler(task.dagRun.input)
        await completeTask(task,result)
    }
    catch(e:any){
        await failTask(task,e.message)
    }
}