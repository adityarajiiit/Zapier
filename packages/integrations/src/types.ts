export type AuthType='OAUTH2'|'APIKEY'|'TOKEN'|'NONE'
export type TriggerType='WEBHOOK'|'POLLING'|'CRON'

export interface ActionContext{
  credentialData?:Record<string,any>
  inputData?:Record<string,any>
  executionId:string
  stepResultId:string
}

export interface TriggerContext{
    credentialData?:Record<string,any>
    config?:Record<string,any>
    cursor?:Record<string,any>
    lastFiredAt?:Date|null
}

export interface TriggerResult{
    items:Record<string,any>[]
    cursor?:Record<string,any>
}

export type ActionHandler=(context:ActionContext)=>Promise<Record<string,any>|void>

export type TriggerHandler=(context:TriggerContext)=>Promise<Record<string,any>[]|TriggerResult>

export interface Action{
    id:string
    name:string
    description?:string
    inputSchema?:Record<string,any>
    outputSchema?:Record<string,any>
    handler:ActionHandler
}

export interface Trigger{
    id:string
    name:string
    description?:string
    triggerType:TriggerType
    outputSchema?:Record<string,any>
    handler?:TriggerHandler
}

export interface Integration{
    id:string
    name:string
    description?:string
    icon?:string
    authType:AuthType
    triggers:Record<string,Trigger>
    actions:Record<string,Action>
}
