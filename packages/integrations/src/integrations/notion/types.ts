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
    properties:Record<string,any>
    children?:any[]
}

export interface UpdatePageInput{
    pageId:string
    properties:Record<string,any>
}

export interface AddToDatabaseInput{
    databaseId:string
    properties:Record<string,any>
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
    children:any[]
}