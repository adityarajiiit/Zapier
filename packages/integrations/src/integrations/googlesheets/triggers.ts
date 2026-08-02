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
        const lastRowCount=context.config?.lastRowCount as number||0
        if(!spreadsheetId||!sheetName){
            return []
        }
        const res=await fetch(`${url}/${spreadsheetId}/values/${sheetName}`,{
            method:'GET',
            headers:headers(accessToken),
        })
        if(!res.ok){
            return []
        }
        const data=await res.json()
        const rows=data.values||[]
        const currentRowCount=rows.length
        const newRows=[]
        if(currentRowCount>lastRowCount){
            for(let i=lastRowCount;i<currentRowCount;i++){
                newRows.push({
                    rowNumber:i+1,
                    values:rows[i],
                })
            }
        }
        return newRows
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

        const last:string[]=context.config?.lastSnapshot||[]
        if(!spreadsheetId||!sheetName){
            return []
        }
        const res=await fetch(`${url}/${spreadsheetId}/values/${sheetName}`,{
            method:'GET',
            headers:headers(accessToken),
        })
        if(!res.ok){
            return []
        }
        const data=await res.json()
        const rows=data.values||[]
        const updatedRows=[]
        for(let i=0;i<rows.length;i++){
            const row=JSON.stringify(rows[i])
            if(last[i]&&last[i]!==row){
                updatedRows.push({
                    rowNumber:i+1,
                    values:rows[i],
                })
            }
        }
        return updatedRows
    }
}