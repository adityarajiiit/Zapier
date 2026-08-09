import{prisma} from '@repo/prisma'
import { CronExpressionParser } from 'cron-parser'

const createExecutionForWorkflow=async(workflowId:string)=>{
    const workflow=await prisma.workflow.findUnique({
        where:{
            id:workflowId
        },
        include:{
            steps:{
                where:{
                    isEnabled:true
                },
                orderBy:{
                    stepOrder:'asc'
                },
                select:{
                    id:true,
                    stepOrder:true
                }
            }
        }
    })
    if(!workflow||!workflow.isActive){
        return null
    }
    const firstStep=workflow.steps[0]||null
    return prisma.workflowExecution.create({
        data:{
            workflowId:workflow.id,
            status:firstStep?'RUNNING':'COMPLETED',
            triggerData:{
                source:'cron',
                firedAt:new Date().toISOString()
            },
            startedAt:new Date(),
            finishedAt:firstStep?null:new Date(),
            stepResults:firstStep?{
                create:{
                    workflowStepId:firstStep.id,
                    stepOrder:firstStep.stepOrder,
                    status:'PENDING'
                }
            }:undefined

        }
    })
}

export const runCronEval=async()=>{
    const now=new Date()
    const due=await prisma.cronSchedule.findMany({
        where:{
            isActive:true,
            nextRunAt:{
                lte:now
            }
        }
    })
    for(const d of due){
        try{
            await createExecutionForWorkflow(d.workflowId)
            const interval=CronExpressionParser.parse(d.cron,{
                currentDate:now,
                tz:'Asia/Kolkata'
            })
            const nextRunAt=interval.next().toDate()
            await prisma.cronSchedule.update({
                where:{
                    id:d.id
                },
                data:{
                    nextRunAt,
                    lastRunAt:now
                }
            })
        }
        catch(e:any){
            console.error(e.message)
        }
    }
}