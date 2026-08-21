import{Queue} from 'bullmq'
import {Redis} from 'ioredis'

export const redis=new Redis(process.env.REDIS_URL!,{
    maxRetriesPerRequest:null
})

export const stepsQueue=new Queue('steps',{
    connection:redis
})

export const pollQueue=new Queue('poll-triggers',{
    connection:redis
})

export const cronQueue=new Queue('cron-triggers',{
    connection:redis
})

export type StepJob={
    stepResultId:string
}

export type PollJob={
    workflowTriggerId:string
}

export type CronJob={
    workflowId:string
}