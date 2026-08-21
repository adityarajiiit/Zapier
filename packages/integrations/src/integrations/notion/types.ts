export interface NotionPage{
    id:string
    object:'page'
    properties:Record<string,any>
    parent:Record<string,any>
    url:string
    createdTime:string
}

export interface NotionDatabase{
    id:string
    title:any[]
    properties:Record<string,any>
    url:string
}

export interface NotionBlock{
    id:string
    type:string
    hasChildren:boolean
    [key:string]:any
}

export interface CreatePageInput{
    parentId:string
    title:string
    content?:string
}

export interface UpdatePageInput{
    pageId:string
    title?:string
    content?:string
}

export interface AddToDatabaseInput{
    databaseId:string
    name?:string
    content?:string
}

export interface SearchInput{
    query:string
    filter?:{
        property:string,
        value:string
    }
    sort?:{
        direction:string,
        timestamp:string
    }
}

export interface CreateDatabaseInput{
    parentId:string
    title:any[]
    properties:Record<string,any>
}

export interface AppendBlockInput{
    pageId:string
    content:string
}