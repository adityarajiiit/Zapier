import { prisma } from '@repo/prisma'
import { encrypt, decrypt } from '@repo/crypto'

export interface TokenData{
    accessToken:string
    refreshToken:string|null
    expiresAt:Date|null
    tokenType:string|null
    response:any
}

export const generateAuthUrl=async(integrationId:string,redirectUri:string,state:string)=>{
    const oauthConfig=await prisma.oAuthConfig.findUnique({
        where:{integrationId}
    })
    if(!oauthConfig){
        throw new Error(`no config of ${integrationId}`)
    }
    const url=new URL(oauthConfig.authUrl)
    url.searchParams.append("client_id",oauthConfig.clientId)
    url.searchParams.append("redirect_uri",redirectUri)
    url.searchParams.append("response_type","code")
    url.searchParams.append("state",state)
    if(oauthConfig.scopes&&oauthConfig.scopes.length>0){
        url.searchParams.append("scope",oauthConfig.scopes.join(" "))
    }
    if(oauthConfig.extraParams){
        const extra=oauthConfig.extraParams as Record<string,string>
        for(const[k,v] of Object.entries(extra)){
            url.searchParams.append(k,v)
        }
    }
    return url.toString()
}

export const exchangeCodeForToken=async(integrationId:string,code:string,redirectUri:string)=>{
    const oauthConfig=await prisma.oAuthConfig.findUnique({
        where:{integrationId},
        include:{
            integration:true
        }
    })
    if(!oauthConfig){
        throw new Error(`no config of ${integrationId}`)    
    }
    const secret=await decrypt(oauthConfig.clientSecret)
    const headers:Record<string,string>={
        "Content-Type":"application/x-www-form-urlencoded"
    }
    const body=new URLSearchParams()
    body.append("grant_type","authorization_code")
    body.append("code",code)
    body.append("redirect_uri",redirectUri)
    const integrationName=oauthConfig.integration.name.toLowerCase()
    if(integrationName==="notion"){
        const basicAuth=Buffer.from(`${oauthConfig.clientId}:${secret}`,"utf-8").toString("base64")
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
        throw new Error(`${await res.text()}`)
    }
    const data=await res.json()
    let expiresAt:Date|null=null
    if(data.expires_in){
        expiresAt=new Date(Date.now()+data.expires_in*1000)
    }
    return{
        accessToken:data.access_token,
        refreshToken:data.refresh_token||null,
        expiresAt:expiresAt,
        tokenType:data.token_type||null,
        response:data
    }
}

export const createCredentialFromTokens=async(userId:string,integrationId:string,label:string,tokenData:TokenData)=>{
    const integration=await prisma.integration.findUnique({
        where:{
            id:integrationId
        }
    })
    if(!integration){
        throw new Error(`no integration with ${integrationId}`)
    }
    const payload={
        accessToken:tokenData.accessToken,
        refreshToken:tokenData.refreshToken,
        expiresAt:tokenData.expiresAt,
        metadata:tokenData.response
    }
    const data=await encrypt(JSON.stringify(payload))
    const credential=await prisma.credential.create({
        data:{
            userId,
            integrationId,
            label,
            authType:integration.authType,
            encryptedData:data,
            tokenExpiresAt:tokenData.expiresAt,
            isValid:true
        }
    })
    return credential
}