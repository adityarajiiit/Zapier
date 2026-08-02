export interface SlackMessage{
    channel:string
    text:string
    ts:string
    user?:string
    blocks?:any[]
}

export interface SlackChannel{
    id:string
    name:string
    isPrivate:boolean
    topic?:string
    purpose?:string
}

export interface SendMessageInput{
    channel:string
    text:string
    blocks?:any[]
}

export interface SendDmInput{
    user:string
    text:string
}

export interface CreateChannelInput{
    name:string
    isPrivate?:boolean
}

export interface SetTopicInput{
    channel:string
    topic:string
}

export interface AddReactionInput{
    channel:string
    timestamp:string
    name:string
}

export  interface UploadFileInput{
    channels:string
    content:string
    filename:string
    title?:string
}