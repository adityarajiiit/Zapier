import { Prisma } from "@repo/prisma";
import { prisma } from "@repo/prisma";
import { ExecutionContext,resolvePath } from "./template.js";
import { evaluateCondition,evaluateFilter,ConditionConfig } from "./condition.js";

export interface ErrorConfig{
    onError:'stop'|'continue'|'retry'
    maxAttempts?:number
    backoff?:number
}

export const buildContext=async(executionId:string)=>{
    const execution=await prisma.workflowExecution.findUniqueOrThrow({
        where:{
            id:executionId
        },
        select:{
            triggerData:true,
        }
    })
    const completed=await prisma.stepResult.findMany({
        where:{
            executionId,
            status:'COMPLETED'
        },
        select:{
            stepOrder:true,
            output:true
        }
    })
    const stepOutputs:any={}
    for(const r of completed){
        stepOutputs[`step${r.stepOrder}`]=r.output||{}
    }
    return{
        triggerData:execution.triggerData||{},
        stepOutputs
    }
}

export const claimNextStep=async(workerId:string)=>{
    return prisma.$transaction(async(t:Prisma.TransactionClient)=>{
        const rows=await t.$queryRaw<any>`
        SELECT id,"execution-id","step-order","attempt-number","workflow-step-id"
        FROM "step-results"
        WHERE status='PENDING'
        AND "step-order"=(
            SELECT MIN(sr2."step-order")
            FROM "step-results" sr2
            WHERE sr2."execution-id"="step-results"."execution-id"
            AND sr2.status='PENDING'
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
            where:{
                id:row.id
            },
            data:{
                status:'RUNNING',
                startedAt:now,
                finishedAt:null,
                error:null,
                attemptNumber:{
                    increment:1
                }
            }
        })
        await t.workflowExecution.updateMany({
            where:{
                id:row['execution-id'],
                status:'PENDING'
            },
            data:{
                status:'RUNNING',
                startedAt:now
            }
        })
        return t.stepResult.findUnique({
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
    })
}

export const skipRemainingSteps=async(
    t:Prisma.TransactionClient,
    executionId:string,
    fromStepOrder:number
)=>{
    await t.stepResult.updateMany({
        where:{
            executionId,
            stepOrder:{
                gt:fromStepOrder
            },
            status:'PENDING'
        },
        data:{
            status:'SKIPPED',
            wasSkipped:true,
            finishedAt:new Date(),
        }
    })
    await t.workflowExecution.update({
        where:{
            id:executionId
        },
        data:{
            status:'COMPLETED',
            finishedAt:new Date()
        }
    })
}

export const completeStep=async(
    t:Prisma.TransactionClient,
    stepResultId:string,
    outputData:any
)=>{
    const sr=await t.stepResult.findUniqueOrThrow({
        where:{
            id:stepResultId
        },
        select:{
            executionId:true,
            startedAt:true,
            stepOrder:true
        }
    })

    const now=new Date()
    const duration=sr.startedAt?now.getTime()-sr.startedAt.getTime():null
    await t.stepResult.update({
        where:{
            id:stepResultId
        },
        data:{
            status:'COMPLETED',
            output:{
                ...outputData,
                duration
            },
            finishedAt:now
        }
    })

    if(outputData?.skippedRemaining){
        await t.workflowExecution.update({
            where:{
                id:sr.executionId
            },
            data:{
                status:'COMPLETED',
                finishedAt:now
            }
        })
        return
    }

    const nextStep=await t.workflowStep.findFirst({
        where:{
            workflow:{
                executions:{
                    some:{
                        id:sr.executionId
                    }
                }
            },
            stepOrder:{
                gt:sr.stepOrder
            },
            isEnabled:true
        },
        orderBy:{
            stepOrder:'asc'
        }
    })
    if(nextStep){
        await t.stepResult.create({
            data:{
                executionId:sr.executionId,
                workflowStepId:nextStep.id,
                stepOrder:nextStep.stepOrder,
                status:'PENDING'
            }
        })
    }
    else{
        await t.workflowExecution.update({
            where:{
                id:sr.executionId
            },
            data:{
                status:'COMPLETED',
                finishedAt:now
            }
        })
    }
}

export const failStep=async(
    t:Prisma.TransactionClient,
    stepResultId:string,
    error:string,
    errorConfig?:ErrorConfig|null
)=>{
    const sr=await t.stepResult.findUniqueOrThrow({
        where:{
            id:stepResultId
        },
        select:{
            executionId:true,
            attemptNumber:true,
            stepOrder:true
        }
    })
    const now=new Date()
    const onError=errorConfig?.onError||'retry'
    const maxAttempts=errorConfig?.maxAttempts||5
    if(onError==='retry'&&sr.attemptNumber<maxAttempts){
        await t.stepResult.update({
            where:{
                id:stepResultId
            },
            data:{
                status:'PENDING',
                error,
                finishedAt:now
            }
        })
    }
    else if(onError==='continue'){
        await t.stepResult.update({
            where:{
                id:stepResultId
            },
            data:{
                status:'SKIPPED',
                wasSkipped:true,
                error,
                finishedAt:now
            }
        })
        const nextStep=await t.workflowStep.findFirst({
            where:{
                workflow:{
                    executions:{
                        some:{
                            id:sr.executionId
                        }
                    }
                },
                stepOrder:{
                    gt:sr.stepOrder
                },
                isEnabled:true
            },
            orderBy:{
                stepOrder:'asc'
            }
        })
        if(nextStep){
            await t.stepResult.create({
                data:{
                    executionId:sr.executionId,
                    workflowStepId:nextStep.id,
                    stepOrder:nextStep.stepOrder,
                    status:'PENDING'
                }
            })
        }
        else{
            await t.workflowExecution.update({
                where:{
                    id:sr.executionId
                },
                data:{
                    status:'COMPLETED',
                    finishedAt:now
                }
            })
        }
    }
    else{
        await t.stepResult.update({
            where:{
                id:stepResultId
            },
            data:{
                status:'FAILED',
                error,
                finishedAt:now
            }
        })
        await t.workflowExecution.update({
            where:{
                id:sr.executionId
            },
            data:{
                status:'FAILED',
                error,
                finishedAt:now
            }
        })
    }
}
export const resolveString=(str:string,triggerData:any,previousOutputs:any)=>{
    const regex=/\{\{([^}]+)\}\}/g
    const matches=[...str.matchAll(regex)]
    if(matches.length===0){
        return str
    }
    if(matches.length===1&&str.trim()===matches[0]?.[0]){
        return resolvePath(matches[0]?.[1]||"".trim(),{
            triggerData,
            stepOutputs:previousOutputs
        })
    }
    return str.replace(regex,(match,p1)=>{
        const p=resolvePath(p1.trim(),{
            triggerData,
            stepOutputs:previousOutputs
        })
        if(p===undefined||p===null){
            return ""
        }
        if(typeof p==='string'){
            return p
        }
        return JSON.stringify(p)
    })
}

export const resolveValue=(value:any,triggerData:any,previousOutputs:any):any=>{
    if(typeof value==='string'){
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

export const resolveInput=(input:any,triggerData:any,previousOutputs:any)=>{
    return resolveValue(input,triggerData,previousOutputs)
}
export {evaluateCondition,evaluateFilter,resolvePath }
export type {ExecutionContext,ConditionConfig}