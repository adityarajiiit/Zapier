import {prisma,TaskInstance} from "@repo/prisma";
export const claimTask=async(workerId:string)=>{
    const [claimed]=await prisma.$queryRaw<TaskInstance[]>`
    UPDATE "task-instances"
    SET
      status='RUNNING'::"TaskInstanceEnum",
      "started-at"=NOW(),
      "attempt-number"="attempt-number"+1
    WHERE id=(
    SELECT id FROM "task-instances"
    WHERE status='READY'::"TaskInstanceEnum"
    AND "remaining-dependencies"=0
    ORDER BY "dag-run-id","task-node-id"
    FOR UPDATE SKIP LOCKED
    LIMIT 1
    )
    RETURNING *
    `
    if(!claimed){
        return null
    }
    const task=await prisma.taskInstance.findUnique({
        where:{
            id:claimed.id
        },
        include:{taskNode:true,dagRun:true}
    })
    return task
}

