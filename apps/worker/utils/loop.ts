import { claimStep } from "./claim.js"
import { executeStep } from "./executor.js"

export const startPollingLoop=(workerId:string)=>{
    return setInterval(async()=>{
        try{
            const step=await claimStep(workerId)
            if(!step){
                return
            }
            await executeStep(step,workerId)
            const next=await claimStep(workerId)
            if(next){
                await executeStep(next,workerId)
            }
        } 
        catch(e){
            console.error(e)
        }
    },500)
}