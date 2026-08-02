import{Action,ActionContext}from "../../types.js"
import{
   AddRowInput,
   UpdateRowInput,
   GetRowInput,
   SearchRowsInput,
   CreateSpreadsheetInput,
   CreateSheetInput
} from './types.js'

const url='https://sheets.googleapis.com/v4/spreadsheets'
const headers=(accessToken?:string)=>({
    'Content-Type':'application/json',
    'Authorization':`Bearer ${accessToken}`
})

export const addRowAction:Action={
    id:'add-row',
    name:'Add Row',
    description:'Adds a new row to a Google Sheet',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AddRowInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/${input.spreadsheetId}/values/${input.sheetName}:append?valueInputOption=USER_ENTERED`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                values:[input.values],
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
    description:'Updates an existing row in a Google Sheet',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as UpdateRowInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/${input.spreadsheetId}/values/${input.range}?valueInputOption=USER_ENTERED`,{
            method:'PUT',
            headers:headers(accessToken),
            body:JSON.stringify({
                values:[input.values],
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const getRowAction:Action={
    id:'get-row',
    name:'Get Row',
    description:'Get a specific row',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as GetRowInput
        const accessToken=context.credentialData?.accessToken as string
        const range=`${input.sheetName}!A${input.rowNumber}:ZZ${input.rowNumber}`
        const res=await fetch(`${url}/${input.spreadsheetId}/values/${range}`,{
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
    description:'Search for rows in a Google Sheet',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SearchRowsInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/${input.spreadsheetId}/values/${input.sheetName}`,{
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
    description:'Creates a new Google Spreadsheet',
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
    description:'Creates a new sheet in an existing Google Spreadsheet',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateSheetInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/${input.spreadsheetId}:batchUpdate`,{
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