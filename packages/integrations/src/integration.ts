import { Integration,ActionHandler,TriggerHandler, } from "./types.js"
import { prisma } from "@repo/prisma"
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
                        id:trigger.id,
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
                        id:action.id,
                        integrationId:integration.id,
                        name:action.name,
                        description:action.description||null,
                        inputSchema:action.inputSchema as any||null,
                        outputSchema:action.outputSchema as any||null,
                    }
                })
            }
        }
    }
}

export const integration=new Integrations()