import{Action,ActionContext}from'../../types.js'
import{
    CreatePageInput,
    UpdatePageInput,
    AddToDatabaseInput,
    SearchInput,
    CreateDatabaseInput,
    AppendBlockInput
} from './types.js'

const enc=(v:any)=>encodeURIComponent(String(v||''))

const url='https://api.notion.com/v1'

const headers=(accessToken:string)=>({
    'Authorization':`Bearer ${accessToken}`,
    'Notion-Version':'2022-06-28',
    'Content-Type':'application/json'
})

export const createPageAction:Action={
    id:'create-page',
    name:'Create Page',
    description:'create new page',
    inputSchema:{
        parentId:{
            type:'string',
            description:'parent id.To use that data block write it as {{stepX.id}}'
        },
        title:{
            type:'string',
            description:'page title.To use that data block write it as {{stepX.title}}'
        },
        content:{
            type:'string',
            description:'page content.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'
        }
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            url:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreatePageInput
        const accessToken=context.credentialData?.accessToken as string
        const properties={
            title:{
                title:[
                    {
                        text:{
                            content:input.title||'Untitled'
                        }
                    }
                ]
            }
        }
        const children=input.content?[
            {
                object:'block',
                type:'paragraph',
                paragraph:{
                    rich_text:input.content.match(/(.|[\r\n]){1,1000}/g)?.map(chunk=>({
                        type:'text',
                        text:{
                            content:chunk
                        }
                    }))||[]
                }
            }
        ]:[]
        const res=await fetch(`${url}/pages`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                parent:{page_id:input.parentId},
                properties,
                children
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
    description:'add to database',
    inputSchema:{
        databaseId:{type:'string',description:'database id'},
        name:{type:'string',description:'row name / title.To use that data block write it as {{stepX.name}}'},
        content:{type:'string',description:'additional text content (optional).Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            url:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AddToDatabaseInput
        const accessToken=context.credentialData?.accessToken as string
        const properties:Record<string,any>={}
        if(input.name){
            properties['Name']={
                title:[{text:{content:input.name}}]
            }
        }
        if(input.content){
            properties['Content']={
                rich_text:[{type:'text',text:{content:input.content}}]
            }
        }
        const res=await fetch(`${url}/pages`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                parent:{database_id:input.databaseId},
                properties
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const updatePageAction:Action={
    id:'update-page',
    name:'Update Page',
    description:'update page',
    inputSchema:{
        pageId:{type:'string',description:'page id.To use that data block write it as {{stepX.id}}'},
        title:{type:'string',description:'new page title (optional).To use that data block write it as {{stepX.title}}'},
        content:{type:'string',description:'new page content / body text (optional).Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            url:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as UpdatePageInput
        const accessToken=context.credentialData?.accessToken as string
        const properties:Record<string,any>={}
        if(input.title){
            properties['title']={
                title:[{text:{content:input.title}}]
            }
        }
        if(input.content){
            properties['content']={
                rich_text:[{type:'text',text:{content:input.content}}]
            }
        }
        const res=await fetch(`${url}/pages/${enc(input.pageId)}`,{
            method:'PATCH',
            headers:headers(accessToken),
            body:JSON.stringify({properties})
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const searchAction:Action={
    id:'search',
    name:'Search',
    description:'search notion',
    inputSchema:{
        query:{type:'string',description:'search query.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        filter:{type:'string',description:'filter by page or database like {"value":"page","property":"object"}'},
        sort:{type:'string',description:'sort direction ascending or descending like {"direction":"descending","timestamp":"last edited time"}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            results:{type:'array'}
        }
    },
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
    description:'create database',
    inputSchema:{
        parentId:{type:'string',description:'parent id.To use that data block write it as {{stepX.id}}'},
        title:{type:'string',description:'database title.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        properties:{type:'string',description:'column definitions {"Name":{"title":{}},"Status":{"select":{}},"Due":{"date":{}}}.To use that data block write it as {{stepX.id}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            url:{type:'string'}
        }
    },
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
    description:'append blocks',
    inputSchema:{
        pageId:{type:'string',description:'page id.To use that data block write it as {{stepX.id}}'},
        content:{type:'string',description:'text to append.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            results:{type:'array'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AppendBlockInput
        const accessToken=context.credentialData?.accessToken as string
        const children=[
            {
                object:'block',
                type:'paragraph',
                paragraph:{
                    rich_text:input.content.match(/(.|[\r\n]){1,2000}/g)?.map(chunk=>({
                        type:'text',
                        text:{
                            content:chunk
                        }
                    }))||[]
                }
            }
        ]
        const res=await fetch(`${url}/blocks/${enc(input.pageId)}/children`,{
            method:'PATCH',
            headers:headers(accessToken),
            body:JSON.stringify({
                children
            })
        }
        )
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}