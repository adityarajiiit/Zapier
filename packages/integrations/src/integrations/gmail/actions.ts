import{Action,ActionContext} from'../../types.js'
import{
    SendEmailInput,
    ReplyInput,
    AddLabelInput,
    CreateDraftInput,
    SearchInput
} from './types.js'

const url='https://gmail.googleapis.com/gmail/v1'
const headers=(accessToken?:string)=>({
    'Authorization':`Bearer ${accessToken}`,
    'Content-Type':'application/json'
})

const email=(to:string,subject:string,body:string,isHtml:boolean=false,cc?:string,bcc?:string,customHeaders:Record<string,string>={})=>{
    let email=`To: ${to}\r\n`
    email+=`Subject: ${subject}\r\n`
    if(cc){
        email+=`Cc:${cc}\r\n`
    }
    if(bcc){
        email+=`Bcc:${bcc}\r\n`
    }
    for(const[k,v] of Object.entries(customHeaders)){
        email+=`${k}:${v}\r\n`
    }
    email+=`Content-Type:${isHtml?'text/html':'text/plain'}`
    email+=body
    return Buffer.from(email).toString('base64url')
}

export const sendEmailAction:Action={
    id:'send-email',
    name:'Send Email',
    description:'Send an email',
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
    description:'Reply to an email',
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
    description:'Add a label to an email',
    handler:async(context:ActionContext)=>{
        const input=context.inputData as AddLabelInput
        const accessToken=context.credentialData?.accessToken
        const res=await fetch(`${url}/users/me/messages/${input.messageId}/modify`,{
            method:'POST',
            headers:headers(accessToken),
            body:JSON.stringify({
                addLabelIds:[input.labelIds],
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
    description:'Create a draft email',
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
    description:'Search for emails',
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
                const msgRes=await fetch(`${url}/users/me/messages/${msg.id}`,{
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
