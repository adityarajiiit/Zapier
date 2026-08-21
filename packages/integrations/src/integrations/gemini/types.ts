export interface GenerateTextInput{
    prompt:string
    systemInstructions?:string
}

export interface SummarizeInput{
    text:string
    type?:'points'|'paragraph'|'table'
}

export interface ClassifyInput{
    text:string
    categories:string[]
}

export interface ExtractDataInput{
    text:string
    fields:string[]
}

export interface TransformTextInput{
    text:string
    instructions:string
}