import { Integration } from "../../types.js";

export const integrationTest:Integration={
    id:'test',
    name:'Test',
    authType:'NONE',
    triggers:{},
    actions:{
       log:{
        id:'log',
        name:'Log Data',
        handler:async(context:any)=>{
            return{
                logged:true,
                data:context.inputData
            }
        }
       },
       delay:{
        id:'delay',
        name:'Delay',
        handler:async(context:any)=>{
            const seconds=context.inputData?.seconds||1
            await new Promise((res)=>setTimeout(res,seconds*1000))
            return{
                delayed:true
            }
        }
       },
       fail:{
        id:'fail',
        name:'Always Fail',
        handler:async(context:any)=>{
            throw new Error('always fail')
        }
       }
    }
}