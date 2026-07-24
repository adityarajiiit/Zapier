import{prisma} from "@repo/prisma"

export const claimStep=async(workerId:string)=>{
    const rows=await prisma.$queryRaw<any>`
    WITH nextstep AS (
        SELECT sr.id
        FROM "step-results" sr
        WHERE sr.status='PENDING'::"StepStatus"
          AND NOT EXISTS(
            SELECT 1
            FROM "step-results" sr2
            WHERE sr2."execution-id"=sr."execution-id"
              AND sr2.status='RUNNING'::"StepStatus"
          )
        ORDER BY sr."step-order" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED    
    )
    UPDATE "step-results"
    SET
      status='RUNNING'::"StepStatus",
      "started-at"=NOW(),
      "attempt-number"="step-results"."attempt-number"+1
      WHERE id=(SELECT id FROM nextstep)
      RETURNING id
    `
    if(!rows||rows.length===0){
        return null
    }
    const stepId=rows[0].id
    const fullStep=await prisma.stepResult.findUnique({
        where:{
            id:stepId
        },
        include:{
            execution:true,
            workflowStep:{
                include:{
                    action:true,
                    credential:true
                }
            }
        }
    })
    return fullStep
}