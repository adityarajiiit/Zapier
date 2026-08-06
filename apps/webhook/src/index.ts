import { verifyGithub } from "./verification/github.js";
import { verifySlack } from "./verification/slack.js";

export const verifyWebhook=(
    integrationName:string,
    body:Buffer,
    headers:any,
    secret:string
)=>{
    const name=integrationName.toLowerCase()
    if(name==='github'){
        const sig=headers['x-hub-signature-256']
        return verifyGithub(body,sig,secret)    
    }
    if(name==='slack'){
        const sig=headers['x-slack-signature']
        const ts=headers['x-slack-request-timestamp']
        return verifySlack(body,sig,ts,secret)
    }
    return false
}