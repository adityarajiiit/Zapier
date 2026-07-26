import {prisma} from '@repo/prisma'
import{encrypt,decrypt}from"@repo/crypto"

export interface CredentialData{
    accessToken:string
    refreshToken:string|null
    expiresAt:Date|null
    metadata?:any
}

export const refreshIfNeeded=async(credentialId:string)=>{
    const credential=await prisma.credential.findUnique({
        where:{
            id:credentialId
        },
        include:{
            integration:{
                include:{
                    oauthConfig:true
                }
            }
        }
    })
    if(!credential){
        throw new Error(`credential ${credentialId} not found`)
    }
    const decrypted=await decrypt(credential.encryptedData)
    const tokenData=JSON.parse(decrypted)
    const accessToken=tokenData.accessToken
    if(!credential.tokenExpiresAt){
        return {accessToken,wasRefreshed:false}
    }
    const now=new Date()
    const expiresAt=new Date(credential.tokenExpiresAt)
    const timeUntillExpiry=expiresAt.getTime()-now.getTime()
    if(timeUntillExpiry>5*60*1000){
        return{
            accessToken,
            wasRefreshed:false
        }
    }
    const refreshToken=tokenData.refreshToken
    if(!refreshToken){
        await prisma.credential.update({
            where:{
                id:credentialId
            },
            data:{
                isValid:false
            }
        })
        throw new Error("no refresh token")
    }
    const oauthConfig=credential.integration.oauthConfig
    if(!oauthConfig){
        throw new Error(`no oauth config of ${credential.id}`)
    }
    const secret=await decrypt(oauthConfig.clientSecret)
    const headers:Record<string,string>={
        "Content-Type": "application/x-www-form-urlencoded"
    }
    const body=new URLSearchParams()
    body.append("grant_type","refresh_token")
    body.append("refresh_token",refreshToken)
    const integrationName=credential.integration.name.toLowerCase()
    if(integrationName==="notion"){
        const basicAuth=Buffer.from(`${oauthConfig.clientId}:${secret}`).toString("base64")
        headers["Authorization"]=`Basic ${basicAuth}`
    }
    else{
        body.append("client_id",oauthConfig.clientId)
        body.append("client_secret",secret)
    }
    if(integrationName==="github"){
        headers["Accept"]="application/json"
    }
    const res=await fetch(oauthConfig.tokenUrl,{
        method:"POST",
        headers,
        body:body.toString()
    })
    if(!res.ok){
        throw new Error(await res.text())
    }
    const data=await res.json()
    const newAccessToken=data.access_token
    const newRefreshToken=data.refresh_token||refreshToken
    let newExpiresAt:Date|null=null
    if(data.expires_in){
        newExpiresAt=new Date(Date.now()+data.expires_in*1000)
    }
    const newPayload={
        ...tokenData,
        accessToken:newAccessToken,
        refreshToken:newRefreshToken,
        expiresAt:newExpiresAt
    }
    const newData=await encrypt(JSON.stringify(newPayload))
    await prisma.credential.update({
        where:{
            id:credentialId
        },
        data:{
            encryptedData:newData,
            tokenExpiresAt:newExpiresAt,
            isValid:true
        }
    })
    return{accessToken:newAccessToken,wasRefreshed:true}
}

export const getDecryptedCredential=async(credentialId:string)=>{
    await refreshIfNeeded(credentialId)
    const credential=await prisma.credential.findUnique({
        where:{
            id:credentialId
        }
    })
    if(!credential){
        throw new Error(`credential ${credentialId} not found`)
    }
    const decrypted=await decrypt(credential.encryptedData)
    const tokenData=JSON.parse(decrypted)
    return {
        accessToken:tokenData.accessToken,
        refreshToken:tokenData.refreshToken,
        expiresAt:tokenData.expiresAt?new Date(tokenData.expiresAt):null,
        metadata:tokenData.metadata
    }
}
