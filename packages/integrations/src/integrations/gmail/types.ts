export interface GmailMessage{
    id:string
    threadId:string
    snippet:string
    labelIds:string[]
    payload:any
}

export interface GmailLabel{
    id:string
    name:string
    type:string
}

export interface SendEmailInput{
    to:string
    subject:string
    body:string
    cc?:string
    bcc?:string
    isHtml?:boolean
}

export interface ReplyInput{
    threadId:string
    messageId:string
    body:string
}

export interface AddLabelInput{
    messageId:string
    labelIds:string[]
}

export interface CreateDraftInput{
    to:string
    subject:string
    body:string
}

export interface SearchInput{
    query:string
    maxResults?:number
}