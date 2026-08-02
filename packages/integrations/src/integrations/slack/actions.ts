import { Action,ActionContext } from "../../types.js";
import{
    SendMessageInput,
    SendDmInput,
    CreateChannelInput,
    SetTopicInput,
    AddReactionInput,
    UploadFileInput
} from './types.js'

const url='https://slack.com/api'

const headers=(accessToken?:string)=>({
    'Authorization':`Bearer ${accessToken}`,
    'Content-Type':'application/json'
})

export const sendMessageAction:Action={
    id:'send-message',
    name:'Send Message',
    description:'Send a message to a channel',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SendMessageInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/chat.postMessage`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                channel:input.channel,
                text:input.text,
                blocks:input.blocks,
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        const data=await res.json()
        if(!data.ok){
            throw new Error(`${data.error}`)
        }
        return data
    }
}

export const sendDmAction:Action={
    id:'send-dm',
    name:'Send Direct Message',
    description:'Send a direct message to a user',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SendDmInput
        const accessToken=context.credentialData?.accessToken
        const openRes=await fetch(`${url}/conversations.open`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                channel:input.user,
            })
        })
        if(!openRes.ok){
            throw new Error(`${openRes.status}`)
        }
        const openData=await openRes.json()
        if(!openData.ok){
            throw new Error(openData.error)
        }
        const channelId=openData.channel.id
        const sendRes=await fetch(`${url}/chat.postMessage`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                channel:channelId,
                text:input.text,
            })
        })
        if(!sendRes.ok){
            throw new Error(`${sendRes.status}`)
        }
        const sendData=await sendRes.json()
        if(!sendData.ok){
            throw new Error(`${sendData.error}`)
        }
        return sendData
    }
}

export const createChannelAction:Action={
    id:'create-channel',
    name:'Create Channel',
    description:'Create a new channel',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateChannelInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/conversations.create`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                name:input.name,
                is_private:input.isPrivate||false,
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        const data=await res.json()
        if(!data.ok){
            throw new Error(`${data.error}`)
        }
        return data
    }
}

export const setTopicAction:Action={
    id:'set-topic',
    name:'Set Topic',
    description:'Set a channel topic',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SetTopicInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/conversations.setTopic`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                channel:input.channel,
                topic:input.topic,
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        const data=await res.json()
        if(!data.ok){
            throw new Error(`${data.error}`)
        }
        return data
    }
}

export const addReactionAction:Action={
    id:'add-reaction',
    name:'Add Reaction',
    description:'Add a reaction to a message',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AddReactionInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/reactions.add`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                channel:input.channel,
                timestamp:input.timestamp,
                name:input.name,
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        const data=await res.json()
        if(!data.ok){
            throw new Error(`${data.error}`)
        }
        return data
    }
}

export const uploadFileAction:Action={
    id:'upload-file',
    name:'Upload File',
    description:'Upload a file to a channel',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as UploadFileInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/files.uploadV2`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                channels:input.channels,
                content:input.content,
                filename:input.filename,
                title:input.title,
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        const data=await res.json()
        if(!data.ok){
            throw new Error(`${data.error}`)
        }
        return data
    }
}