import { Integration,ActionHandler,TriggerHandler, } from "./types.js"
import { prisma } from "@repo/prisma"
import{encrypt} from "@repo/crypto"
class Integrations{
    private integrations=new Map<string,Integration>()
    register(integration:Integration){
        this.integrations.set(integration.id,integration)
    }
    getIntegration(id:string):Integration|undefined{
      return  this.integrations.get(id)
    }
    getAction(integrationId:string,actionId:string):ActionHandler|undefined{
       const integration=this.getIntegration(integrationId)
       return integration?.actions[actionId]?.handler
    }
    getTrigger(integrationId:string,triggerId:string):TriggerHandler|undefined{
        const integration=this.getIntegration(integrationId)
        return integration?.triggers[triggerId]?.handler
    }
    listAll():Integration[]{
        return Array.from(this.integrations.values())
    }
    async seed(){
        const allIntegrations=this.listAll()
        for(const integration of allIntegrations){
            await prisma.integration.upsert({
                where:{
                    id:integration.id
                },
                update:{
                    name:integration.name,
                    description:integration.description||null,
                    icon:integration.icon||null,
                    authType:integration.authType,
                },
                create:{
                    id:integration.id,
                    name:integration.name,
                    description:integration.description||null,
                    icon:integration.icon||null,
                    authType:integration.authType,
                }
            })
            for(const [key,trigger] of Object.entries(integration.triggers)){
                await prisma.trigger.upsert({
                    where:{
                       integrationId_name:{
                        integrationId:integration.id,
                        name:trigger.name,
                       }
                    },
                    update:{
                        description:trigger.description||null,
                        triggerType:trigger.triggerType,
                        outputSchema:trigger.outputSchema as any||null,
                    },
                    create:{
                        id:`${integration.id}-${trigger.id}`,
                        integrationId:integration.id,
                        name:trigger.name,
                        description:trigger.description||null,
                        triggerType:trigger.triggerType,
                        outputSchema:trigger.outputSchema as any||null,
                    }
                })
            }
            for(const [key,action] of Object.entries(integration.actions)){
                await prisma.action.upsert({
                    where:{
                       integrationId_name:{
                        integrationId:integration.id,
                        name:action.name,
                       }
                    },
                    update:{
                        description:action.description||null,
                        inputSchema:action.inputSchema as any||null,
                        outputSchema:action.outputSchema as any||null,
                    },
                    create:{
                        id:`${integration.id}-${action.id}`,
                        integrationId:integration.id,
                        name:action.name,
                        description:action.description||null,
                        inputSchema:action.inputSchema as any||null,
                        outputSchema:action.outputSchema as any||null,
                    }
                })
            }
            if(integration.authType==='OAUTH2'){
                const oauthMeta=oauthMap[integration.id]
                if(oauthMeta){
                    const clientId=process.env[oauthMeta.clientIdEnv]
                    const clientSecret=process.env[oauthMeta.clientSecretEnv]
                    if(clientId&&clientSecret){
                        const encryptedSecret=await encrypt(clientSecret)
                        await prisma.oAuthConfig.upsert({
                            where:{integrationId:integration.id},
                            update:{
                                clientId,
                                clientSecret:encryptedSecret,
                                authUrl:oauthMeta.authUrl,
                                tokenUrl:oauthMeta.tokenUrl,
                                scopes:oauthMeta.scopes,
                                extraParams:oauthMeta.extraParams as any||null,
                            },
                            create:{
                                integrationId:integration.id,
                                clientId,
                                clientSecret:encryptedSecret,
                                authUrl:oauthMeta.authUrl,
                                tokenUrl:oauthMeta.tokenUrl,
                                scopes:oauthMeta.scopes,
                                extraParams:oauthMeta.extraParams as any||null,
                            }
                        })
                    }
                }
            }
        }
    }
}

const oauthMap:Record<string,{
    clientIdEnv:string
    clientSecretEnv:string
    authUrl:string
    tokenUrl:string
    scopes:string[]
    extraParams?:Record<string,string>
}>={
    github:{
        clientIdEnv:'GITHUB_CLIENT_ID',
        clientSecretEnv:'GITHUB_CLIENT_SECRET',
        authUrl:'https://github.com/login/oauth/authorize',
        tokenUrl:'https://github.com/login/oauth/access_token',
        scopes:['repo','read:user'],
    },
    slack:{
        clientIdEnv:'SLACK_CLIENT_ID',
        clientSecretEnv:'SLACK_CLIENT_SECRET',
        authUrl:'https://slack.com/oauth/v2/authorize',
        tokenUrl:'https://slack.com/api/oauth.v2.access',
        scopes:['chat:write','channels:read'],
    },
    gmail:{
        clientIdEnv:'GOOGLE_CLIENT_ID',
        clientSecretEnv:'GOOGLE_CLIENT_SECRET',
        authUrl:'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl:'https://oauth2.googleapis.com/token',
        scopes:[
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
        ],
        extraParams:{prompt:'consent',access_type:'offline'},
    },
    'google-sheets':{
        clientIdEnv:'GOOGLE_CLIENT_ID',
        clientSecretEnv:'GOOGLE_CLIENT_SECRET',
        authUrl:'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl:'https://oauth2.googleapis.com/token',
        scopes:['https://www.googleapis.com/auth/spreadsheets'],
        extraParams:{prompt:'consent',access_type:'offline'},
    },
    notion:{
        clientIdEnv:'NOTION_CLIENT_ID',
        clientSecretEnv:'NOTION_CLIENT_SECRET',
        authUrl:'https://api.notion.com/v1/oauth/authorize',
        tokenUrl:'https://api.notion.com/v1/oauth/token',
        scopes:[],
    },
}

export const integration=new Integrations()