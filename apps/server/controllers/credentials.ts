import{prisma} from"@repo/prisma"
import {FastifyRequest,FastifyReply} from "fastify"
import {encrypt,decrypt} from "@repo/crypto"
import {getDecryptedCredential} from "@repo/oauth"
export const credentialController={
    getAll:async(req:any,reply:any)=>{
        const userId=req.userId as string
        if(!userId){
            return reply.status(400).send({
                error:"missing userId"
            })
        }
        const credentials=await prisma.credential.findMany({
            where:{
                userId
            },
            include:{
                integration:true
            }
        })
        const credential=credentials.map(cred=>({
            id:cred.id,
            label:cred.label,
            integrationId:cred.integrationId,
            integrationName:cred.integration.name,
            authType:cred.authType,
            isValid:cred.isValid,
            createdAt:cred.createdAt
        }))
        return reply.send(credential)
    },
    create:async(req:any,reply:any)=>{
        const userId=req.userId as string
        if(!userId){
            return reply.status(400).send({
                error:"missing userId"
            })
        }
        const{integrationId,label,authType,apiKey,bearerToken}=req.body as{
            integrationId:string
            label:string
            authType:"APIKEY"|"TOKEN"|"OAUTH2"|"NONE"
            apiKey?:string
            bearerToken?:string
        }
        if(authType!="APIKEY"&&authType!=="TOKEN"){
            return reply.status(400).send({
                error:"invalid authType use oauth flow"
            })
        }
        let data:any={}
        if(authType==="APIKEY"){
            if(!apiKey){
                return reply.status(400).send({
                    error:"missing apiKey"
                })
            }
            data={apiKey:apiKey}
        }
        else if(authType==="TOKEN"){
            if(!bearerToken){
                return reply.status(400).send({
                    error:"missing bearerToken"
                })
            }
            data={accessToken:bearerToken}
        }
        const enData=await encrypt(JSON.stringify(data))
        const credential=await prisma.credential.create({
            data:{
                userId,
                integrationId,
                label,
                authType,
                encryptedData:enData,
                isValid:true,
            }
        })
        return reply.send({
            id:credential.id,
            label:credential.label,
            integrationId:credential.integrationId,
            authType:credential.authType,
            isValid:credential.isValid,
            createdAt:credential.createdAt
        })
    },
    delete:async(req:any,reply:any)=>{
        const userId=req.userId as string
        if(!userId){
            return reply.status(400).send({
                error:"missing userId"
            })
        }
        const {id}=req.params as{id:string}
        const credential=await prisma.credential.findUnique({
            where:{
                id
            },
            include:{
                workflowSteps:true,
                workflowTriggers:true
            }
        })
        if(!credential){
            return reply.status(404).send({
                error:"no credentials"
            })
        }
        if(credential.userId!==userId){
            return reply.status(400).send({
                error:"not allowed"
            })
        }
        if(credential.workflowTriggers.length>0||credential.workflowSteps.length>0){
            return reply.status(400).send({
                error:"credential is in use",
                userInTriggers:credential.workflowTriggers.length,
                usedInSteps:credential.workflowSteps.length
            })
        }
        await prisma.credential.delete({
            where:{
                id
            }
        })
        return reply.send({
            success:true,
            message:"credential deleted"
        })
    },
    test:async(req:any,reply:any)=>{
        const userId=req.userId as string
        if(!userId){
            return reply.status(400).send({
                error:"missing userId"
            })
        }
        const{id}=req.params as{id:string}
        const credential=await prisma.credential.findUnique({
            where:{
                id
            },
            include:{
                integration:true
            }
        })
        if(!credential){
            return reply.status(404).send({
                error:"no credentials"
            })
        }
        if(credential.userId!==userId){
            return reply.status(400).send({
                error:"not allowed"
            })
        }
        try{
           let token=""
           if(credential.authType==="OAUTH2"){
            const decrypted=await getDecryptedCredential(id)
            token=decrypted.accessToken
           }
           else{
            const decrypted=await decrypt(credential.encryptedData)
            const data=JSON.parse(decrypted)
            token=data.accessToken||data.apiKey
           }
           const integrationName=credential.integration.name.toLowerCase()
           let isValid=true
           let error=""
           if(integrationName==="github"){
            const res=await fetch("https://api.github.com/user",{
                headers:{
                    "Authorization":`Bearer ${token}`,
                    "Accept":"application/json"
                }
            })
            isValid=res.ok
            if(!res.ok){
                error=await res.text()
            }
           }
           else if(integrationName==="slack"){
            const res=await fetch("https://slack.com/api/auth.test",{
                headers:{
                    "Authorization":`Bearer ${token}`
                }
            })
            const data=await res.json()
            isValid=data.ok
            if(!isValid){
                error=data.error
            }
           }
           else if(integrationName==="google"){
            const res=await fetch("https://www.googleapis.com/oauth2/v3/userinfo",{
                headers:{
                    "Authorization":`Bearer ${token}`
                }
            })
            isValid=res.ok
            if(!res.ok){
                error=await res.text()
            }
           }
           else if(integrationName==="notion"){
            const res=await fetch("https://api.notion.com/v1/users/me",{
                headers:{
                    "Authorization":`Bearer ${token}`,
                    "Notion-Version":"2022-06-28"
                }
            })
            isValid=res.ok
            if(!res.ok){
                error=await res.text()
            }
           }
           else if(integrationName==="gemini"){
            const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${token}`,{
                method:"GET"
            })
            isValid=res.ok
            if(!res.ok){
                error=await res.text()
            }
           }
           else{
            isValid=credential.isValid
           }
           if(credential.isValid!==isValid){
            await prisma.credential.update({
                where:{
                    id
                },
                data:{
                    isValid
                }
            })
           }
           return reply.send({
            isValid,
            error:isValid?undefined:error
           })
        }
        catch(e:any){
            await prisma.credential.update({
                where:{
                    id
                },
                data:{
                    isValid:false
                }
            })
            return reply.send({
                isValid:false,
                error:e.message
            })
        }
    }
}