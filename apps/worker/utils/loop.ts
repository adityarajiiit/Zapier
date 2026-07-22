import { claimTask } from "./claim.js"
import { executeTask } from "./executor.js"

export const startPollingLoop=(workerId:string)=>{
    return setInterval(async()=>{
        try{
            const task=await claimTask(workerId)
            if(!task){
                return
            }
            await executeTask(task,workerId)
            const next=await claimTask(workerId)
            if(next){
                await executeTask(next,workerId)
            }
        } 
        catch(e){
            console.error(e)
        }
    },5000)
}