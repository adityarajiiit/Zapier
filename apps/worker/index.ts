import { prisma } from "@repo/prisma"
import * as os from "os"
import { executeStep } from "./utils/executor.js"
import { integration } from "@repo/integrations"
import { pollJob } from "./utils/poller.js"
import { redis,stepsQueue } from "@repo/queue"
import { Worker } from "bullmq"
import "@repo/engine"

const workerId=`${os.hostname()}-${process.pid}`
console.log(`${workerId} started`)
await integration.seed()

const keys=await redis.keys('integrations-*')
if(keys.length>0){
    await redis.del(...keys)
}
const stepsWorker=new Worker('steps',async(job:any)=>{
    const {stepResultId}=job.data
    const stepResult=await prisma.stepResult.findUnique({
        where:{id:stepResultId},
        include:{
            workflowStep:{
                include:{
                    action:true
                }
            },
            execution:true
        }
    })
    if(!stepResult){
        throw new Error("step result not found")
    }
    await executeStep(stepResult,workerId)
},{
    connection:redis,
    concurrency:5,
    stalledInterval:30*1000,
    maxStalledCount:2,
    removeOnComplete:{count:1000},
    removeOnFail:{count:1000}
})

const pollWorker=new Worker('poll-triggers',pollJob,{
    connection:redis,
    concurrency:10,
    removeOnComplete:{count:100},
    removeOnFail:{count:100}
})

const cronWorker=new Worker('cron-triggers',async(job:any)=>{
    const{workflowId}=job.data
    const workflow=await prisma.workflow.findUnique({
        where:{id:workflowId},
        include:{
            steps:{
                where:{isEnabled:true},
                orderBy:{stepOrder:'asc'},
                select:{id:true,stepOrder:true}
            }
        }
    })
    if(!workflow||!workflow.isActive){
        return
    }
    const firstStep=workflow.steps[0]||null
    const execution=await prisma.workflowExecution.create({
        data:{
            workflowId:workflow.id,
            status:firstStep?'RUNNING':'COMPLETED',
            triggerData:{source:'cron',firedAt:new Date().toISOString()},
            startedAt:new Date(),
            finishedAt:firstStep?null:new Date(),
            stepResults:firstStep?{
                create:{
                    workflowStepId:firstStep.id,
                    stepOrder:firstStep.stepOrder,
                    status:'PENDING'
                }
            }:undefined
        },
        include:{stepResults:true}
    })
    const firstStepResult=execution.stepResults?.[0]||null
    if(firstStepResult){
        await stepsQueue.add('execute-step',{stepResultId:firstStepResult.id},{attempts:5,backoff:{type:'exponential',delay:1000}})
    }
},{
    connection:redis,
    concurrency:5,
    removeOnComplete:{count:100},
    removeOnFail:{count:100}
})

async function shutdown(){
    console.log(`${workerId} shutting down`)
    await stepsWorker.close()
    await pollWorker.close()
    await cronWorker.close()
    await prisma.$disconnect()
    process.exit(0)
}
process.on("SIGINT",shutdown)
process.on("SIGTERM",shutdown)
