import { FastifyRequest,FastifyReply } from "fastify";
import { prisma } from "@repo/prisma";
import { generateAuthUrl,exchangeCodeForToken,createCredentialFromTokens } from "@repo/oauth";
import{redis} from"@repo/prisma"
import crypto from "node:crypto";
export const oauthController={
    connect:async(req:FastifyRequest,reply:FastifyReply)=>{
        const userId=req.headers["x-user-id"] as string
        if(!userId){
            return reply.status(400).send({
                error:"missing userId"
            })
        }
        const {integrationId}=req.params as{integrationId:string}
        const integration=await prisma.integration.findUnique({
            where:{
                id:integrationId
            }
        })
        if(!integration){
            return reply.status(404).send({
                error:"integration not found"
            })
        }
        if(integration.authType!=="OAUTH2"){
            return reply.status(400).send({
                error:"integration is not oauth2"
            })
        }
        const state=crypto.randomUUID()
        const stateData=JSON.stringify({
            userId,
            integrationId
        })
        await redis.set(`oauth-state-${state}`,stateData,"EX",600)
        let redirectUri=process.env.OAUTH_REDIRECT_URL
        if(integration.name.toLowerCase()==="slack"){
            redirectUri=process.env.SLACK_REDIRECT_URL!
        }
        try{
            const url=await generateAuthUrl(integrationId,redirectUri!,state)
            return reply.redirect(url)
        }
        catch(e:any){
            return reply.status(500).send({
                error:e.message
            })
        }
    },
    callback:async(req:FastifyRequest,reply:FastifyReply)=>{
        const{code,state}=req.query as{
            code?:string,
            state?:string
        }
        if(!code||!state){
            return reply.redirect(`http://localhost:3001?error=missing_params`)
        }
        const stateKey=`oauth-state-${state}`
        const stateData=await redis.get(stateKey)
        if(!stateData){
            return reply.redirect(`http://localhost:3001?error=invalid_or_expired_state`)
        }
        await redis.del(stateKey)
        try{
            const{userId,integrationId}=JSON.parse(stateData)
            const integration=await prisma.integration.findUnique({
                where:{
                    id:integrationId
                }
            })
            if(!integration){
                return reply.redirect(`http://localhost:3001?error=integration_not_found`)
            }
            let redirectUri=process.env.OAUTH_REDIRECT_URL
            if(integration.name.toLowerCase()==="slack"){
                redirectUri=process.env.SLACK_REDIRECT_URL!
            }
            const tokenData=await exchangeCodeForToken(integrationId,code,redirectUri!)
            const label=`${integration.name}-Account`
            await createCredentialFromTokens(userId,integrationId,label,tokenData)
            return reply.redirect(`http://localhost:3001?connected=true`)
        }
        catch(e:any){
            return reply.redirect(`http://localhost:3001?error=${e.message}`)
        }
    }
}