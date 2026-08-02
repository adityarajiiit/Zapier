import{Action,ActionContext}from'../../types.js'
import{
    CreatePageInput,
    UpdatePageInput,
    AddToDatabaseInput,
    SearchInput,
    CreateDatabaseInput,
    AppendBlockInput
} from './types.js'

const url='https://api.notion.com/v1'

const headers=(accessToken:string)=>({
    'Authorization':`Bearer ${accessToken}`,
    'Notion-Version':'2022-06-28',
    'Content-Type':'application/json'
})

export const createPageAction:Action={
    id:'create-page',
    name:'Create Page',
    description:'Creates a new page in Notion',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreatePageInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/pages`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                parent:{page_id:input.parentId},
                properties:input.properties,
                children:input.children
            })
        }
        )
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const addToDatabaseAction:Action={
    id:'add-to-database',
    name:'Add to Database',
    description:'Adds a new page to a Notion database',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AddToDatabaseInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/pages`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                parent:{database_id:input.databaseId},
                properties:input.properties
            })
        }
        )
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const updatePageAction:Action={
    id:'update-page',
    name:'Update Page',
    description:'Update page properties',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as UpdatePageInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/pages/${input.pageId}`,{
            method:'PATCH',
            headers:headers(accessToken),
            body:JSON.stringify({
                properties:input.properties
            })
        }
        )
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const searchAction:Action={
    id:'search',
    name:'Search',
    description:'Search pages and databases',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SearchInput
        const accessToken=context.credentialData?.accessToken as string
        const body:Record<string,any>={query:input.query}
        if(input.filter){
            body.filter=input.filter
        }
        if(input.sort){
            body.sort=input.sort
        }
        const res=await fetch(`${url}/search`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify(body)
        }
        )
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const createDatabaseAction:Action={
    id:'create-database',
    name:'Create Database',
    description:'Creates a new database in Notion',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateDatabaseInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/databases`,{
            method:'POST',
            headers:headers(accessToken as string),
            body:JSON.stringify({
                parent:{page_id:input.parentId},
                title:input.title,
                properties:input.properties
            })
        }
        )
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const appendBlockAction:Action={
    id:'append-block',
    name:'Append Block',
    description:'Appends blocks to a page in Notion',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AppendBlockInput
        const accessToken=context.credentialData?.accessToken as string
        const res=await fetch(`${url}/blocks/${input.pageId}/children`,{
            method:'PATCH',
            headers:headers(accessToken),
            body:JSON.stringify({
                children:input.children
            })
        }
        )
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}