import { handlers} from "@repo/db/handlers";
import {completeTask,failTask} from "@repo/db/task-complete"
import { TaskInstance, TaskNode, DagRun } from "@repo/prisma";
import {prisma} from "@repo/prisma"
export const executeTask=async(task:TaskInstance&{taskNode:TaskNode,dagRun:DagRun},workerId:string)=>{
    try{
        const handler=handlers.get(task.taskNode.handler)
        if(!handler){
            await prisma.$transaction(async(t)=>{
                await failTask(t,task.id,task.taskNodeId,task.dagRunId,"handler not found")
            })
            return
        }
        const result=await handler(task.dagRun.input)
        await prisma.$transaction(async(t)=>{
            await completeTask(t,task.id,task.taskNodeId,task.dagRunId,result)
        })
    }
    catch(e: any){
        await prisma.$transaction(async(t)=>{
            await failTask(t,task.id,task.taskNodeId,task.dagRunId,e?.message || "Unknown error")
        })
    }
}
