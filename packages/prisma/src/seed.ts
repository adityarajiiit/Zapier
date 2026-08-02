import{prisma} from'./index.js'
import{encrypt}from'@repo/crypto'

const oauthIntegrations=[
    {
        name:'Github',
        authUrl:'https://github.com/login/oauth/authorize',
        tokenUrl:'https://github.com/login/oauth/access_token',
        clientIdEnv:'GITHUB_CLIENT_ID',
        clientSecretEnv:'GITHUB_CLIENT_SECRET',
    },
    {
        name:'Slack',
        authUrl:'https://slack.com/oauth/v2/authorize',
        tokenUrl:'https://slack.com/api/oauth.v2.access',
        clientIdEnv:'SLACK_CLIENT_ID',
        clientSecretEnv:'SLACK_CLIENT_SECRET',
    },
    {
        name:'Notion',
        authUrl:'https://api.notion.com/v1/oauth/authorize',
        tokenUrl:'https://api.notion.com/v1/oauth/token',
        clientIdEnv:'NOTION_CLIENT_ID',
        clientSecretEnv:'NOTION_CLIENT_SECRET',
    },
    {
        name:'Gmail',
        authUrl:'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl:'https://oauth2.googleapis.com/token',
        clientIdEnv:'GOOGLE_GMAIL_CLIENT_ID',
        clientSecretEnv:'GOOGLE_GMAIL_CLIENT_SECRET',
    },
    {
        name:'GoogleSheets',
        authUrl:'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl:'https://oauth2.googleapis.com/token',
        clientIdEnv:'GOOGLE_SHEETS_CLIENT_ID',
        clientSecretEnv:'GOOGLE_SHEETS_CLIENT_SECRET',
    }
]

const main=async()=>{
    for(const config of oauthIntegrations){
        const clientId=process.env[config.clientIdEnv]
        const clientSecret=process.env[config.clientSecretEnv]
        if(!clientId||!clientSecret){
            console.warn(`missing secret ${config.name}`)
            continue
        }
        const integration=await prisma.integration.findFirst({
            where:{name:config.name}
        })
        if(!integration){
            console.warn(`integration ${config.name} not found`)
            continue
        }
        const encryptedSecret=await encrypt(clientSecret)
        await prisma.oAuthConfig.upsert({
            where:{integrationId:integration.id},
            update:{
                clientId,
                clientSecret:encryptedSecret,
                authUrl:config.authUrl,
                tokenUrl:config.tokenUrl
            },
            create:{
                integrationId:integration.id,
                clientId,
                clientSecret:encryptedSecret,
                authUrl:config.authUrl,
                tokenUrl:config.tokenUrl
            }
        })
        console.log(`seeded oauth config for ${config.name}`)
    }
    await prisma.$disconnect()
}

main().catch(e=>{
    console.error(e)
    process.exit(1)
})