import{Action,ActionContext} from'../../types.js'
import{
    SendEmailInput,
    ReplyInput,
    AddLabelInput,
    CreateDraftInput,
    SearchInput
} from './types.js'

const enc=(v:any)=>encodeURIComponent(String(v||''))

const url='https://gmail.googleapis.com/gmail/v1'
const headers=(accessToken?:string)=>({
    'Authorization':`Bearer ${accessToken}`,
    'Content-Type':'application/json'
})

const headerValue=(value:string)=>String(value||'').replace(/[\r\n]+/g,' ').trim()

const headerName=(name:string)=>{
    const clean=String(name||'').trim()
    if(!/^[A-Za-z0-9-]+$/.test(clean)){
        throw new Error(`invalid email header name: ${name}`)
    }
    return clean
}

const email=(to:string,subject:string,body:string,isHtml:boolean=false,cc?:string,bcc?:string,customHeaders:Record<string,string>={})=>{
    let email=`To: ${headerValue(to)}\r\n`
    email+=`Subject: ${headerValue(subject)}\r\n`
    if(cc){
        email+=`Cc: ${headerValue(cc)}\r\n`
    }
    if(bcc){
        email+=`Bcc: ${headerValue(bcc)}\r\n`
    }
    for(const[k,v] of Object.entries(customHeaders)){
        email+=`${headerName(k)}: ${headerValue(v)}\r\n`
    }
    email+=`Content-Type: ${isHtml?'text/html':'text/plain'}; charset="UTF-8"\r\n`
    email+=`MIME-Version: 1.0\r\n\r\n`
    email+=body
    return Buffer.from(email).toString('base64url')
}

export const sendEmailAction:Action={
    id:'send-email',
    name:'Send Email',
    description:'send email',
    inputSchema:{
        to:{type:'string',description:'to address.To use that data block write it as {{stepX.email}}'},
        subject:{type:'string',description:'email subject.To use that data block write it as {{stepX.subject}}'},
        body:{type:'string',description:'email body.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        cc:{type:'string',description:'cc address'},
        bcc:{type:'string',description:'bcc address'},
        isHtml:{type:'string',description:'is html true/false'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            threadId:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SendEmailInput
        const accessToken=context.credentialData?.accessToken
        const raw=email(input.to,input.subject,input.body,input.isHtml,input.cc,input.bcc)
        const res=await fetch(`${url}/users/me/messages/send`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({raw})
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const replyToEmailAction:Action={
    id:'reply-to-email',
    name:'Reply to Email',
    description:'reply to email',
    inputSchema:{
        threadId:{type:'string',description:'thread id.To use that data block write it as {{stepX.threadId}}'},
        messageId:{type:'string',description:'message id.To use that data block write it as {{stepX.id}}'},
        body:{type:'string',description:'reply body.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            threadId:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as ReplyInput
        const accessToken=context.credentialData?.accessToken
        const customHeaders={
            'In-Reply-To':input.messageId,
            'References':input.messageId
        }
        const raw=email('','',input.body,false,undefined,undefined,customHeaders)
        const res=await fetch(`${url}/users/me/messages/send`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                raw,
                threadId:input.threadId,
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const addLabelAction:Action={
    id:'add-label',
    name:'Add Label',
    description:'add email label',
    inputSchema:{
        messageId:{type:'string',description:'message id.To use that data block write it as {{stepX.id}}'},
        labelIds:{type:'string',description:'comma separated labelIds like Label-1, Label-2.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AddLabelInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/users/me/messages/${enc(input.messageId)}/modify`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                addLabelIds:input.labelIds.split(',').map(l=>l.trim()),
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const createDraftAction:Action={
    id:'create-draft',
    name:'Create Draft',
    description:'create draft email',
    inputSchema:{
        to:{type:'string',description:'to address.To use that data block write it as {{stepX.email}}'},
        subject:{type:'string',description:'email subject.To use that data block write it as {{stepX.subject}}'},
        body:{type:'string',description:'email body.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'}
    },
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as CreateDraftInput
        const accessToken=context.credentialData?.accessToken
        const raw=email(input.to,input.subject,input.body)
        const res=await fetch(`${url}/users/me/drafts`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                message:{
                    raw
                },
            })
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        return res.json()
    }
}

export const searchEmailsAction:Action={
    id:'search-emails',
    name:'Search Emails',
    description:'search emails',
    inputSchema:{
        query:{type:'string',description:'search query.Use the exact output field name from the previous step e.g. {{step0.text}} or {{step0.summary}}'},
        maxResults:{type:'string',description:'max results'}
    },
    outputSchema:{
        type:'object',
        properties:{
            messages:{type:'array'}
        }
    },
    handler:async(context:ActionContext)=>{
        const input=context.inputData as SearchInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/users/me/messages?q=${encodeURIComponent(input.query)}&maxResults=${input.maxResults||10}`,{
            method:'GET',
            headers:headers(accessToken),
        })
        if(!res.ok){
            throw new Error(`${res.status}`)
        }
        const data=await res.json()
        const messages=[]
        if(data.messages&&data.messages.length>0){
            for(const msg of data.messages){
                const msgRes=await fetch(`${url}/users/me/messages/${enc(msg.id)}`,{
                    method:'GET',
                    headers:headers(accessToken),
                })
                if(msgRes.ok){
                    const msgData=await msgRes.json()
                    messages.push(msgData)
                }
            }
        }
        return {messages}
    }
}
