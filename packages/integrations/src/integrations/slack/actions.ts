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
    description:'send message',
    inputSchema:{
        channel:{type:'string',description:'channel id.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        text:{type:'string',description:'message text.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        blocks:{type:'string',description:'JSON array format blocks like [{"type":"section"}].To use that data block write it as {{stepX.messageId}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            ok:{type:'boolean'},
            ts:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SendMessageInput
        const accessToken=context.credentialData?.accessToken
        const body:any={
            channel:input.channel,
            text:input.text,
            blocks:input.blocks
        }
        const res=await fetch(`${url}/chat.postMessage`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify(body)
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
    description:'send direct message',
    inputSchema:{
        user:{type:'string',description:'user id.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        text:{type:'string',description:'message text.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            ok:{type:'boolean'},
            ts:{type:'string'}
        }
    },
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
    description:'create channel',
    inputSchema:{
        name:{type:'string',description:'channel name'},
        isPrivate:{type:'string',description:'true or false'}
    },
    outputSchema:{
        type:'object',
        properties:{
            ok:{type:'boolean'},
            channel:{type:'object'}
        }
    },
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
    description:'set channel topic',
    inputSchema:{
        channel:{type:'string',description:'channel id.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        topic:{type:'string',description:'topic text.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            ok:{type:'boolean'}
        }
    },
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
    description:'add reaction',
    inputSchema:{
        channel:{type:'string',description:'channel id'},
        timestamp:{type:'string',description:'message timestamp.To use that data block write it as {{stepX.ts}}'},
        name:{type:'string',description:'emoji name without colons like thumbsup, heart, fire'}
    },
    outputSchema:{
        type:'object',
        properties:{
            ok:{type:'boolean'}
        }
    },
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
    description:'upload file',
    inputSchema:{
        channels:{type:'string',description:'channel ids.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        content:{type:'string',description:'file content.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        filename:{type:'string',description:'filename'},
        title:{type:'string',description:'title'}
    },
    outputSchema:{
        type:'object',
        properties:{
            ok:{type:'boolean'},
            file:{type:'object'}
        }
    },
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