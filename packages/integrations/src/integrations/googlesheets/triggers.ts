import { Trigger, TriggerContext } from '../../types.js';
const url='https://sheets.googleapis.com/v4/spreadsheets'
const headers=(accessToken?:string)=>({
    'Content-Type':'application/json',
    'Authorization':`Bearer ${accessToken}`
})

export const newRowTrigger:Trigger={
    id:'new-row',
    name:'New Row',
    description:'Triggers when a new row is added to a Google Sheet',
    triggerType:'POLLING',
    outputSchema:{
        type:'object',
        properties:{
            rowNumber:{type:'number'},
            values:{
                type:'array',
                items:{
                    type:'string'
                }
            }
        }
    },
    handler:async(context:TriggerContext)=>{
        const accessToken=context.credentialData?.accessToken as string
        const spreadsheetId=context.config?.spreadsheetId as string
        const sheetName=context.config?.sheetName as string
        const seeded=typeof context.cursor?.lastRowCount==='number'
        const lastRowCount=seeded?context.cursor!.lastRowCount as number:0
        if(!spreadsheetId||!sheetName){
            return{items:[]}
        }
        const res=await fetch(`${url}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(sheetName)}`,{
            method:'GET',
            headers:headers(accessToken),
        })
        if(!res.ok){
            throw new Error(`google sheets responded ${res.status}`)
        }
        const data=await res.json()
        const rows=data.values||[]
        const currentRowCount=rows.length
        const newRows=[]
        if(seeded&&currentRowCount>lastRowCount){
            for(let i=lastRowCount;i<currentRowCount;i++){
                newRows.push({
                    rowNumber:i+1,
                    values:rows[i],
                })
            }
        }
        return{
            items:newRows,
            cursor:{lastRowCount:currentRowCount}
        }
    }
}

export const updatedRowTrigger:Trigger={
    id:'updated-row',
    name:'Updated Row',
    description:'Triggers when a row is updated in a Google Sheet',
    triggerType:'POLLING',
    outputSchema:{
        type:'object',
        properties:{
            rowNumber:{type:'number'},
            values:{
                type:'array',
                items:{
                    type:'string'
                }
            }
        }
    },
    handler:async(context:TriggerContext)=>{
        const accessToken=context.credentialData?.accessToken as string
        const spreadsheetId=context.config?.spreadsheetId as string
        const sheetName=context.config?.sheetName as string

        const last:string[]=context.cursor?.lastSnapshot||[]
        if(!spreadsheetId||!sheetName){
            return{items:[]}
        }
        const res=await fetch(`${url}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(sheetName)}`,{
            method:'GET',
            headers:headers(accessToken),
        })
        if(!res.ok){
            throw new Error(`google sheets responded ${res.status}`)
        }
        const data=await res.json()
        const rows=data.values||[]
        const snapshot=rows.map((row:any)=>JSON.stringify(row))
        const updatedRows=[]
        for(let i=0;i<rows.length;i++){
            if(last[i]&&last[i]!==snapshot[i]){
                updatedRows.push({
                    rowNumber:i+1,
                    values:rows[i],
                })
            }
        }
        return{
            items:updatedRows,
            cursor:{lastSnapshot:snapshot}
        }
    }
}