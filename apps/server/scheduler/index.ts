import { runCronEval } from "./croneval.js";
import { runPoll } from "./polling.js";
import { runStucked } from "./cleaner.js";

const intervals:any=[]

export const startScheduler=()=>{
    intervals.push(setInterval(async()=>{
        try{
            await runCronEval()
        }
        catch(e:any){
            console.log(e.message)
        }
    },30000))

    intervals.push(setInterval(async()=>{
        try{
            await runPoll()
        }
        catch(e:any){
            console.log(e.message)
        }
    },60000))

    intervals.push(setInterval(async()=>{
        try{
            await runStucked()
        }
        catch(e:any){
            console.log(e.message)
        }
    },600000))
}

export const stopScheduler=async()=>{
    intervals.forEach(clearInterval)
}