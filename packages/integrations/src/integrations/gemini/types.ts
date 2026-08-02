export interface GenerateTextInput{
    prompt:string
    systemInstructions?:string
    model?:string
}

export interface SummarizeInput{
    text:string
    type?:'points'|'tldr'|'paragraph'|'table'
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