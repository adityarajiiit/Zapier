export interface ProviderConfig{
    authUrl:string
    tokenUrl:string
    scopes:string[]
    refresh:boolean
    params?:Record<string,string>
    useBasicAuthForToken?:boolean
}

const providers:Record<string,ProviderConfig>={
    Github:{
        authUrl:"https://github.com/login/oauth/authorize",
        tokenUrl:"https://github.com/login/oauth/access_token",
        scopes:["repo","read:user"],
        refresh:false
    },
    Google:{
        authUrl:"https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl:"https://oauth2.googleapis.com/token",
        scopes:["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
        refresh:true,
        params:{
            prompt:"consent",
            access_type:"offline"
        }
    },
    Slack:{
        authUrl:"https://slack.com/oauth/v2/authorize",
        tokenUrl:"https://slack.com/api/oauth.v2.access",
        scopes:["chat:write","channels:read"],
        refresh:false
    },
    Notion:{
        authUrl:"https://api.notion.com/v1/oauth/authorize",
        tokenUrl:"https://api.notion.com/v1/oauth/token",
        scopes:[],
        refresh:false,
        useBasicAuthForToken:true
    },
  Gmail:{
    authUrl:"https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl:"https://oauth2.googleapis.com/token",
    scopes:[
      "https://www.googleapis.com/auth/gmail.modify", 
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly"
    ],
    refresh:true,
    params:{prompt:"consent",access_type:"offline"}
  },
  GoogleSheets:{
    authUrl:"https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl:"https://oauth2.googleapis.com/token",
    scopes:[
      "https://www.googleapis.com/auth/spreadsheets"
    ],
    refresh:true,
    params:{prompt:"consent",access_type:"offline"}
  }
}

export const getProviderConfig=(name:string):ProviderConfig|undefined=>{
    return providers[name]
}