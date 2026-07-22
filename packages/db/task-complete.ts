import {prisma} from "@repo/prisma"
import {handlers} from "./handlers.js"

export const completeTask=async(t:any,taskInstanceId:any,taskNodeId:any,dagRunId:any,result:any)=>{
    await t.taskInstance.update({
        where:{
            id:taskInstanceId
        },
        data:{
            status:"COMPLETED",
            result:result,
            finishedAt:new Date()
        }
    })
    await t.$executeRaw`
    UPDATE "task-instances"
    SET
        "remaining-dependencies" = "remaining-dependencies" - 1,
        status = CASE
          WHEN "remaining-dependencies" - 1 = 0 THEN 'READY'::"TaskInstanceEnum"
          ELSE status
        END
    WHERE "dag-run-id" = ${dagRunId}
      AND "task-node-id" IN (
          SELECT "child-task-id" FROM "task-edges"
          WHERE "parent-task-id" = ${taskNodeId}
      )
    `
    const remaining=await t.taskInstance.count({
        where:{
            dagRunId:dagRunId,
            status:{
                notIn:["COMPLETED","FAILED"]
            }
        }
    })
    if(remaining===0){
        const anyFailed=await t.taskInstance.count({
            where:{
                dagRunId:dagRunId,
                status:"FAILED"
            }
        })
        await t.dagRun.update({
            where:{
                id:dagRunId
            },
            data:{
                status:anyFailed>0?"FAILED":"COMPLETED",
                finishedAt:new Date()
            }
        })
    }
}

export const failTask=async(t:any,taskInstanceId:any,taskNodeId:any,dagRunId:any,error:string)=>{
    await t.taskInstance.update({
        where:{
            id:taskInstanceId
        },
        data:{
            status:"FAILED",
            error:error,
            finishedAt:new Date()
        }
    })
    await t.$executeRaw`
    WITH RECURSIVE downstream AS (
        SELECT "child-task-id" FROM "task-edges" WHERE "parent-task-id"=${taskNodeId}
        UNION
        SELECT te."child-task-id" FROM "task-edges" te
        JOIN downstream d ON te."parent-task-id"=d."child-task-id"
    )
    UPDATE "task-instances"
    SET status='FAILED'::"TaskInstanceEnum", error='upstream task failed'
    WHERE "dag-run-id"=${dagRunId}
       AND "task-node-id" IN (SELECT "child-task-id" FROM downstream)
       AND status IN ('WAITING'::"TaskInstanceEnum",'READY'::"TaskInstanceEnum")
    `
    const remaining=await t.taskInstance.count({
        where:{
            dagRunId:dagRunId,
            status:{
                notIn:["COMPLETED","FAILED"]
            }
        }
    })
    if(remaining===0){
        const anyFailed=await t.taskInstance.count({
            where:{
                dagRunId:dagRunId,
                status:"FAILED"
            }
        })
        await t.dagRun.update({
            where:{
                id:dagRunId
            },
            data:{
                status:anyFailed>0?"FAILED":"COMPLETED",
                finishedAt:new Date()
            }
        })
    }
}