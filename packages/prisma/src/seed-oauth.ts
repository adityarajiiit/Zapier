import {prisma} from"./client.js"
import{encrypt} from "@repo/crypto"

const oauthProviders=[
    {
        name:'Github',
        clientId:process.env.GITHUB_CLIENT_ID,
        clientSecret:process.env.GITHUB_CLIENT_SECRET,
        config: {
            authUrl:"https://github.com/login/oauth/authorize",
            tokenUrl:"https://github.com/login/oauth/access_token",
            scopes:["repo","read:user"]
        }
    },
    {
        name:'Google',
        clientId:process.env.GOOGLE_CLIENT_ID,
        clientSecret:process.env.GOOGLE_CLIENT_SECRET,
        config: {
            authUrl:"https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl:"https://oauth2.googleapis.com/token",
            scopes:["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
            params:{prompt:"consent",access_type:"offline"}
        }
    },
    {
        name:'Slack',
        clientId:process.env.SLACK_CLIENT_ID,
        clientSecret:process.env.SLACK_CLIENT_SECRET,
        config: {
            authUrl:"https://slack.com/oauth/v2/authorize",
            tokenUrl:"https://slack.com/api/oauth.v2.access",
            scopes:["chat:write","channels:read"]
        }
    },
    {
        name:'Notion',
        clientId:process.env.NOTION_CLIENT_ID,
        clientSecret:process.env.NOTION_CLIENT_SECRET,
        config: {
            authUrl:"https://api.notion.com/v1/oauth/authorize",
            tokenUrl:"https://api.notion.com/v1/oauth/token",
            scopes:[]
        }
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
        const providerConfig=p.config
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

