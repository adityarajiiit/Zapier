import{Trigger,TriggerContext}from'../../types.js'
const url='https://gmail.googleapis.com/gmail/v1'
const headers=(accessToken?:string)=>({
    'Authorization':`Bearer ${accessToken}`,
    'Content-Type':'application/json'
})

const fetchNewMessages=async(query:string,labelId?:string,accessToken?:string)=>{
    const params=new URLSearchParams({q:query})
    if(labelId){
        params.append('labelIds',labelId)
    }
    const res=await fetch(`${url}/users/me/messages?${params.toString()}`,{
        method:'GET',
        headers:headers(accessToken),
    })
    if(!res.ok){
        return []
    }
    const data=await res.json()
    if(!data.messages||data.messages.length===0){
        return []
    }
    const results=[]
    for(const msg of data.messages){
        const msgRes=await fetch(`${url}/users/me/messages/${msg.id}`,{
            method:'GET',
            headers:headers(accessToken),
        })
        if(msgRes.ok){
            const msgData=await msgRes.json()
            const subjectHeader=msgData.payload?.headers?.find((h:any)=>h.name==='Subject')
            const fromHeader=msgData.payload?.headers?.find((h:any)=>h.name==='From')
            msgData.subject=subjectHeader?subjectHeader.value:''
            msgData.from=fromHeader?fromHeader.value:''
            results.push(msgData)
        }
    }
    return results
}

const getAfterTimestamp=(lastFiredAt?:Date|null)=>{
    return lastFiredAt?Math.floor(lastFiredAt.getTime()/1000):Math.floor(Date.now()/1000)-3600
}

export const newEmailTrigger:Trigger={
    id:'new-email',
    name:'New Email',
    description:'Trigger when a new email is received',
    triggerType:'POLLING',
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            threadId:{
                type:'string'
            },
            snippet:{
                type:'string'
            },
            subject:{
                type:'string'
            },
            from:{
                type:'string'
            },
            payload:{
                type:'object'
            }
        }
    },
    handler:async(context:TriggerContext)=>{
        const accessToken=context.credentialData?.accessToken
        const afterTimestamp=getAfterTimestamp(context.lastFiredAt)
        return fetchNewMessages(`is:inbox after:${afterTimestamp}`,undefined,accessToken)
    }
}

export const newLabeledEmailTrigger:Trigger={
    id:`new-labeled-email`,
    name:'New Labeled Email',
    description:'Trigger when a new email with a specific label is received',
    triggerType:'POLLING',
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            threadId:{
                type:'string'
            },
            snippet:{
                type:'string'
            },
            subject:{
                type:'string'
            },
            from:{
                type:'string'
            },
            payload:{
                type:'object'
            }
        }
    },
    handler:async(context:TriggerContext)=>{
        const accessToken=context.credentialData?.accessToken
        const labelId=context.config?.labelId||''
        const afterTimestamp=getAfterTimestamp(context.lastFiredAt)
        return fetchNewMessages(`after:${afterTimestamp}`,labelId,accessToken)
    }
}

export const newAttachmentTrigger:Trigger={
    id:`new-attachment`,
    name:'New Attachment',
    description:'Trigger when a new email with an attachment is received',
    triggerType:'POLLING',
    outputSchema:{
        type:'object',
        properties:{
            id:{type:'string'},
            threadId:{
                type:'string'
            },
            snippet:{
                type:'string'
            },
            subject:{
                type:'string'
            },
            from:{
                type:'string'
            },
            payload:{
                type:'object'
            }
        }
    },
    handler:async(context:TriggerContext)=>{
        const accessToken=context.credentialData?.accessToken
        const afterTimestamp=getAfterTimestamp(context.lastFiredAt)
        return fetchNewMessages(`has:attachment after:${afterTimestamp}`,undefined,accessToken)
    }
}