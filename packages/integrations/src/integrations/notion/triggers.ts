import{Trigger,TriggerContext}from '../../types.js'

const enc=(v:any)=>encodeURIComponent(String(v||''))
const url='https://api.notion.com/v1'
const headers=(accessToken:string)=>({
    'Authorization':`Bearer ${accessToken}`,
    'Notion-Version':'2022-06-28',
    'Content-Type':'application/json'
})

export const newDatabaseItemTrigger:Trigger={
    id:'new-database-item',
    name:'New Database Item',
    description:'new database item',
    triggerType:'POLLING',
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            properties:{type:'object'},
            url:{type:'string'}
        }
    },
    handler:async(context:TriggerContext)=>{
        const accessToken=context.credentialData?.accessToken as string
        const databaseId=context.config?.databaseId
        if(!databaseId){
            return []
        }
        let filter:any=undefined
        if(context.lastFiredAt){
            filter={
                timestamp:'created_time',
                created_time:{
                    after:context.lastFiredAt.toISOString()
                }
            }
        }
        const res=await fetch(`${url}/databases/${enc(databaseId)}/query`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                filter
            })
        })
        if(!res.ok){
            return []
        }
        const data=await res.json()
        return data.results||[]
    }
}

export const updatedPageTrigger:Trigger={
    id:'updated-page',
    name:'Updated Page',
    description:'updated page',
    triggerType:'POLLING',
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            properties:{type:'object'},
            url:{type:'string'}
        }
    },
    handler:async(context:TriggerContext)=>{
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/search`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                sort:{
                    direction:'descending',
                    timestamp:'last_edited_time'
                }
            })
        }
        )
        if(!res.ok){
            return []
        }
        const data=await res.json()
        const results=data.results||[]
        if(!context.lastFiredAt){
            return results.slice(0,10)
        }
        const lastFiredAt=context.lastFiredAt.getTime()
        return results.filter((page:any)=>{
            if(!page.last_edited_time){
                return false
            }
            return new Date(page.last_edited_time).getTime()>lastFiredAt
        })
    }
}

