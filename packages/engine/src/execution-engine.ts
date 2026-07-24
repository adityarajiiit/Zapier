import { prisma } from '@repo/prisma';
import { Prisma } from '@repo/prisma';

export const claimNextStep=async(workerId:string)=>{
    return prisma.$transaction(async(t:Prisma.TransactionClient)=>{
        const rows=await t.$queryRaw<any>`
        SELECT id,
        "execution-id",
        "step-order",
        "attempt-number",
        "workflow-step-id"
        FROM "step-results"
        WHERE "status" = 'PENDING'
           AND "step-order"=(
            SELECT MIN(sr2."step-order")
            FROM "step-results" sr2
            WHERE sr2."execution-id"="step-results"."execution-id"
               AND sr2."status"='PENDING'
           )
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `
        if(rows.length===0){
            return null
        }
        const row=rows[0]
        const now=new Date()
        await t.stepResult.update({
            where:{id:row.id},
            data:{
                status:'RUNNING',
                startedAt:now,
                finishedAt:null,
                error:null,
                attemptNumber:{increment:1}
            }
        })
        await t.workflowExecution.update({
            where:{
                id:row['execution-id'],
                status:"PENDING"
            },
            data:{
                status:"RUNNING",
                startedAt:now,
            }
        })
        const stepResult=await t.stepResult.findUnique({
            where:{
                id:row.id
            },
            include:{
                workflowStep:{
                    include:{
                        action:true,
                        credential:true
                    }
                },
                execution:true
            }
        })
        return stepResult
    })
}

export const completeStep=async(t:Prisma.TransactionClient,stepResultId:string,outputData:Record<string,any>)=>{
    const stepResult=await t.stepResult.findUniqueOrThrow({
        where:{
            id:stepResultId
        },
        select:{
            executionId:true,
            startedAt:true
        }
    })
    const now=new Date()
    const duration=stepResult.startedAt? now.getTime()-stepResult.startedAt.getTime():null
    await t.stepResult.update({
        where:{
            id:stepResultId
        },
        data:{
            status:"COMPLETED",
            output:{...outputData,duration},
            finishedAt:now,
        }
    })
    const pendingCount=await t.stepResult.count({
        where:{
            executionId:stepResult.executionId,
            status:"PENDING"
        }
    })
    if(pendingCount===0){
        await t.workflowExecution.update({
            where:{
                id:stepResult.executionId
            },
            data:{
                status:"COMPLETED",
                finishedAt:now,
            }
        })
    }
}

export const failStep=async(t:Prisma.TransactionClient,stepResultId:string,error:string,retryable:boolean)=>{
    const stepResult=await t.stepResult.findUniqueOrThrow({
        where:{
            id:stepResultId
        },
        select:{
            executionId:true,
            attemptNumber:true,
        }
    })
    const now=new Date()
    if(retryable&&stepResult.attemptNumber<5){
        await t.stepResult.update({
            where:{
                id:stepResultId
            },
            data:{
                status:"PENDING",
                error,
                finishedAt:now
            }
        })
    }
    else{
        await t.stepResult.update({
            where:{
                id:stepResultId
            },
            data:{
                status:"FAILED",
                error,
                finishedAt:now
            }
        })
        await t.workflowExecution.update({
            where:{
                id:stepResult.executionId
            },
            data:{
                status:"FAILED",
                error,
                finishedAt:now
            }
        })
    }
}

const resolvePath=(path:string,triggerData:Record<string,any>|null,previousStepOutputs:Record<string,Record<string,any>>)=>{
    const parts=path.split('.')
    const source=parts[0]
    const rest=parts.slice(1)
    let root:any
    if(source==undefined){
        return null
    }
    if(source==="trigger"){
        root=triggerData
    }
    else{
        root=previousStepOutputs[source]
    }
    let current:any=root
    for(const part of rest){
        if(current===null||current===undefined){
            return undefined
        }
        current=current[part]
    }
    return current
}

const resolveString=(str:string,triggerData:Record<string,any>|null,previousOutputs:Record<string,Record<string,any>>)=>{
    const regex=/\\{\\{([^}]+)\\}\\}/g
    const matches=[...str.matchAll(regex)]
    if(matches.length===0){
        return str
    }
    if(matches.length===1&&str.trim()===matches[0]?.[0]){
        return resolvePath(matches[0]?.[1]||"".trim(),triggerData,previousOutputs)
    }
    return str.replace(regex,(match,p1)=>{
        const p=resolvePath(p1.trim(),triggerData,previousOutputs)
        if(p===undefined||p===null){
            return ""
        }
        if(typeof p==="string"){
            return p
        }
        return JSON.stringify(p)
    })
}

const resolveValue=(value:any,triggerData:Record<string,any>|null,previousOutputs:Record<string,Record<string,any>>):any=>{
    if(typeof value==="string"){
        return resolveString(value,triggerData,previousOutputs)
    }
    if(Array.isArray(value)){
        return value.map((v)=>resolveValue(v,triggerData,previousOutputs))
    }
    if(value!=null&&typeof value==="object"){
        const result:Record<string,any>={}
        for(const [k,v] of Object.entries(value)){
            result[k]=resolveValue(v,triggerData,previousOutputs)
        }
        return result
    }
    return value
}

export const resolveInput=(input:Record<string,any>,triggerData:Record<string,any>|null,previousOutputs:Record<string,Record<string,any>>):Record<string,any>=>{
    return resolveValue(input,triggerData,previousOutputs) as Record<string,any>
}