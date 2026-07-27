import {prisma} from"./client.js"
import{encrypt} from "@repo/crypto"
import { getProviderConfig } from "@repo/oauth"

const oauthProviders=[
    {
        name:'Github',
        clientId:process.env.GITHUB_CLIENT_ID,
        clientSecret:process.env.GITHUB_CLIENT_SECRET,
    },
    {
        name:'Google',
        clientId:process.env.GOOGLE_CLIENT_ID,
        clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    },
    {
        name:'Slack',
        clientId:process.env.SLACK_CLIENT_ID,
        clientSecret:process.env.SLACK_CLIENT_SECRET,
    },
    {
        name:'Notion',
        clientId:process.env.NOTION_CLIENT_ID,
        clientSecret:process.env.NOTION_CLIENT_SECRET,
    }
]

export const seed=async()=>{
    for(const p of oauthProviders){
        if(!p.clientId||!p.clientSecret){
            console.warn(`missing clientid or secret for ${p.name} `)
            continue;
        }
        let integration=await prisma.integration.findFirst({
            where:{
                name:{
                    equals:p.name,
                    mode:'insensitive'
                }
            }
        })
        if(!integration){
            console.log(`integration missing for ${p.name}`)
            integration=await prisma.integration.create({
                data:{
                    name:p.name,
                    authType:'OAUTH2'
                }
            })
        }
        const providerConfig=getProviderConfig(p.name)
        if(!providerConfig){
            console.warn(`config missing for ${p.name}`)
            continue
        }
        const secret=await encrypt(p.clientSecret)
        await prisma.oAuthConfig.upsert({
            where:{
                integrationId:integration.id
            },
            update:{
                clientId:p.clientId,
                clientSecret:secret,
                authUrl:providerConfig.authUrl,
                tokenUrl:providerConfig.tokenUrl,
                scopes:providerConfig.scopes,
                extraParams:providerConfig.params
            },
            create:{
                integrationId:integration.id,
                clientId:p.clientId,
                clientSecret:secret,
                authUrl:providerConfig.authUrl,
                tokenUrl:providerConfig.tokenUrl,
                scopes:providerConfig.scopes,
                extraParams:providerConfig.params
            }
        })
        console.log(`saved oauth config for ${p.name} `)
    }
}

