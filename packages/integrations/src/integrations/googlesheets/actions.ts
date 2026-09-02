import{Action,ActionContext}from "../../types.js"
import{
   AddRowInput,
   UpdateRowInput,
   GetRowInput,
   SearchRowsInput,
   CreateSpreadsheetInput,
   CreateSheetInput
} from './types.js'

const enc=(v:any)=>encodeURIComponent(String(v||''))

const url='https://sheets.googleapis.com/v4/spreadsheets'
const headers=(accessToken?:string)=>({
    'Content-Type':'application/json',
    'Authorization':`Bearer ${accessToken}`
})

export const addRowAction:Action={
    id:'add-row',
    name:'Add Row',
    description:'add row',
    inputSchema:{
        spreadsheetId:{type:'string',description:'spreadsheet id'},
        sheetName:{type:'string',description:'sheet name'},
        values:{type:'string',description:'comma separated values like a, b, c.To use that data block write it as {{stepX.updates}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            updates:{type:'object'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AddRowInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/${enc(input.spreadsheetId)}/values/${enc(input.sheetName)}:append?valueInputOption=RAW`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                values:[input.values.split(',')],
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const updateRowAction:Action={
    id:'update-row',
    name:'Update Row',
    description:'update row',
    inputSchema:{
        spreadsheetId:{type:'string',description:'spreadsheet id'},
        range:{type:'string',description:'cell range like Sheet1!A2:C2'},
        values:{type:'string',description:'comma separated values like a, b, c.To use that data block write it as {{stepX.updates}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            updates:{type:'object'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as UpdateRowInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/${enc(input.spreadsheetId)}/values/${enc(input.range)}?valueInputOption=RAW`,{
            method:'PUT',
            headers:headers(accessToken),
            body:JSON.stringify({
                values:[input.values.split(',')],
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return {updates:await res.json()}
    }
}

export const getRowAction:Action={
    id:'get-row',
    name:'Get Row',
    description:'get row',
    inputSchema:{
        spreadsheetId:{type:'string',description:'spreadsheet id'},
        sheetName:{type:'string',description:'sheet name'},
        rowNumber:{type:'string',description:'row number.To use that data block write it as {{stepX.rowNumber}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            values:{type:'array'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as GetRowInput
        const accessToken=context.credentialData?.accessToken as string
        const range=`${input.sheetName}!A${input.rowNumber}:ZZ${input.rowNumber}`
        const res=await fetch(`${url}/${enc(input.spreadsheetId)}/values/${enc(range)}`,{
            method:'GET',
            headers:headers(accessToken),
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const searchRowsAction:Action={
    id:'search-rows',
    name:'Search Rows',
    description:'search rows',
    inputSchema:{
        spreadsheetId:{type:'string',description:'spreadsheet id'},
        sheetName:{type:'string',description:'sheet name'},
        columnIndex:{type:'string',description:'column index (0 = first column, 1 = second column, ...)'},
        searchValue:{type:'string',description:'search value.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            values:{type:'array'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SearchRowsInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/${enc(input.spreadsheetId)}/values/${enc(input.sheetName)}`,{
            method:'GET',
            headers:headers(accessToken),
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        const data=await res.json()
        const rows=data.values||[]
        const matchedRows=rows.filter((row:any[])=>{
            const cellValue=row[input.columnIndex]
            return cellValue!==undefined&&cellValue.toString()===input.searchValue
        })
        return {values:matchedRows}
    }
}

export const createSpreadsheetAction:Action={
    id:'create-spreadsheet',
    name:'Create Spreadsheet',
    description:'create spreadsheet',
    inputSchema:{
        title:{type:'string',description:'spreadsheet title'}
    },
    outputSchema:{
        type:'object',
        properties:{
            spreadsheetId:{type:'string'},
            spreadsheetUrl:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateSpreadsheetInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                properties:{
                    title:input.title
                },
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const createSheetAction:Action={
    id:'create-sheet',
    name:'Create Sheet',
    description:'create sheet',
    inputSchema:{
        spreadsheetId:{type:'string',description:'spreadsheet id'},
        title:{type:'string',description:'sheet title'}
    },
    outputSchema:{
        type:'object',
        properties:{
            replies:{type:'array'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateSheetInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/${enc(input.spreadsheetId)}:batchUpdate`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                requests:[{
                    addSheet:{
                        properties:{
                            title:input.title
                        }
                    }
                }],
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}