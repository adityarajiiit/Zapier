import{createApi,fetchBaseQuery}from"@reduxjs/toolkit/query/react"
import{getSession}from"next-auth/react"

export interface Workflow{
    id:string
    name:string
    description?:string
    isActive:boolean
    createdAt:string
    updatedAt:string
    trigger?:WorkflowTrigger
    steps?:WorkflowStep[]
}

export interface WorkflowTrigger{
    integrationId:string
    triggerId:string
    credentialId:string
    config:Record<string,any>
}

export interface WorkflowStep{
    id:string
    integrationId:string
    actionId:string
    credentialId:string
    name:string
    input:Record<string,any>
    stepOrder:number
    stepType?:'ACTION'|'CONDITION'|'FILTER'|'DELAY'
    conditionConfig?:any
    errorConfig?:any
}

export interface Integration{
    id:string
    name:string
    description?:string
    iconUrl?:string
    authType:AuthType
    triggers?:IntegrationTrigger[]
    actions?:IntegrationAction[]
}

export interface IntegrationTrigger{
    id:string
    name:string
    description?:string
    configSchema?:Record<string,any>
    outputSchema?:Record<string,any>
}

export interface IntegrationAction{
    id:string
    name:string
    description?:string
    inputSchema?:Record<string,any>
    outputSchema?:Record<string,any>
}

export interface StepResult{
    id:string
    executionId:string
    workflowStepId:string
    stepOrder:number
    status:'PENDING'|'RUNNING'|'COMPLETED'|'FAILED'|'SKIPPED'
    input?:Record<string,any>
    output?:Record<string,any>
    error?:string
    startedAt?:string
    finishedAt?:string
    attemptNumber:number
}

export interface Execution{
    id:string
    workflowId:string
    status:'PENDING'|'RUNNING'|'COMPLETED'|'FAILED'|'CANCELLED'
    triggerData?:Record<string,any>
    startedAt?:string
    finishedAt?:string
    error?:string
    createdAt:string
    stepResults?:StepResult[]
}

export interface Credential{
    id:string
    label:string
    integrationId:string
    integrationName:string
    authType:string
    isValid:boolean
    createdAt:string
}

export type AuthType='APIKEY'|'TOKEN'|'OAUTH2'|'NONE'

export interface CreateCredentialPayload{
    label:string
    integrationId:string
    authType:AuthType
    apiKey?:string
    bearerToken?:string
}

export interface RequiredField{
    stepId:string
    stepName:string
    stepOrder:number
    fieldKey:string
    fieldLabel:string
}

export interface GenerateWorkflowResult{
    workflowId:string
    requiredFields:RequiredField[]
}


export const api=createApi({
    reducerPath:"api",
    baseQuery:fetchBaseQuery({
        baseUrl:process.env.NEXT_PUBLIC_API_URL,
        prepareHeaders:async(headers)=>{
            const session=await getSession() as any
            if(session?.token){
                headers.set("Authorization",`Bearer ${session.token}`)
            }
            return headers
        }
    }),
    tagTypes:['Workflows','Executions','Integrations','Credentials'],
    endpoints:(builder)=>({
        getWorkflows:builder.query<Workflow[],void>({
            query:()=>"/workflows",
            providesTags:["Workflows"]
        }),
        getWorkflow:builder.query<Workflow,string>({
            query:(id)=>`/workflows/${id}`,
            providesTags:(result,error,id)=>[{type:"Workflows",id}]
        }),
        createWorkflow:builder.mutation<Workflow,Partial<Workflow>>({
            query:(body)=>({
                url:'/workflows',
                method:'POST',
                body
            }),
            invalidatesTags:["Workflows"]
        }),
        updateWorkflow:builder.mutation<Workflow,{id:string}&Partial<Workflow>>({
            query:({id,...body})=>({
                url:`/workflows/${id}`,
                method:'PUT',
                body,
            }),
            invalidatesTags:(result,error,{id})=>["Workflows",{type:"Workflows",id}]
        }),
        deleteWorkflow:builder.mutation<void,string>({
            query:(id)=>({
                url:`/workflows/${id}`,
                method:'DELETE',
            }),
            invalidatesTags:["Workflows"]
        }),
        activateWorkflow:builder.mutation<Workflow,string>({
            query:(id)=>({
                url:`/workflows/${id}/activate`,
                method:'POST',
                body:{}
            }),
            invalidatesTags:["Workflows"]
        }),
        deactivateWorkflow:builder.mutation<Workflow,string>({
            query:(id)=>({
                url:`/workflows/${id}/deactivate`,
                method:'POST',
                body:{}
            }),
            invalidatesTags:["Workflows"]
        }),
        triggerWorkflow:builder.mutation<Execution,string>({
            query:(id)=>({
                url:`/workflows/${id}/trigger`,
                method:'POST',
                body:{}
            }),
            invalidatesTags:["Executions"]
        }),
        addStep:builder.mutation<WorkflowStep,Partial<WorkflowStep>&{workflowId:string}>({
            query:({workflowId,...body})=>({
                url:`/workflows/${workflowId}/steps`,
                method:'POST',
                body,
            }),
            invalidatesTags:(result,error,{workflowId})=>[{type:"Workflows",id:workflowId}]
        }),
        updateStep:builder.mutation<WorkflowStep,Partial<WorkflowStep>&{workflowId:string,stepId:string}>({
            query:({workflowId,stepId,...body})=>({
                url:`/workflows/${workflowId}/steps/${stepId}`,
                method:'PUT',
                body,
            }),
            invalidatesTags:(result,error,{workflowId})=>[{type:"Workflows",id:workflowId}]
        }),
        deleteStep:builder.mutation<void,{workflowId:string,stepId:string}>({
            query:({workflowId,stepId})=>({
                url:`/workflows/${workflowId}/steps/${stepId}`,
                method:'DELETE',
            }),
            invalidatesTags:(result,error,{workflowId})=>[{type:"Workflows",id:workflowId}]
        }),
        reorderSteps:builder.mutation<void,{workflowId:string,steps:{id:string,stepOrder:number}[]}>({
            query:({workflowId,steps})=>({
                url:`/workflows/${workflowId}/steps/reorder`,
                method:'PUT',
                body:steps,
            }),
            invalidatesTags:(result,error,{workflowId})=>[{type:"Workflows",id:workflowId}]
        }),
        syncWorkflow:builder.mutation<{success:boolean},{id:string,trigger:any,steps:any[]}>({
            query:({id,...body})=>({
                url:`/workflows/${id}/sync`,
                method:'PUT',
                body,
            }),
            invalidatesTags:(result,error,{id})=>[{type:'Workflows',id}]
        }),

        getIntegrations:builder.query<Integration[],void>({
            query:()=>"/integrations",
            providesTags:["Integrations"]
        }),
        getIntegration:builder.query<Integration,string>({
            query:(id)=>`/integrations/${id}`,
            providesTags:(result,error,id)=>[{type:"Integrations",id}]
        }),
        getExecutions:builder.query<Execution[],{workflowId?:string}|void>({
            query:(params)=>({
                url:'/executions',
                params:params??{}
            }),
            providesTags:['Executions']
        }),
        getExecution:builder.query<Execution,string>({
            query:(id)=>`/executions/${id}`,
            providesTags:(result,error,id)=>[{type:"Executions",id}]
        }),
        getCredentials:builder.query<Credential[],void>({
            query:()=>'/credentials',
            providesTags:['Credentials']
        }),
        createCredential:builder.mutation<Credential,CreateCredentialPayload>({
            query:(body)=>({
                url:'/credentials',
                method:'POST',
                body,
            }),
            invalidatesTags:['Credentials']
        }),
        deleteCredential:builder.mutation<void,string>({
            query:(id)=>({
                url:`/credentials/${id}`,
                method:'DELETE',
            }),
            invalidatesTags:['Credentials']
        }),
        generateWorkflow:builder.mutation<GenerateWorkflowResult,{prompt:string}>({
            query:(body)=>({
                url:'/workflows/generate',
                method:'POST',
                body
            }),
            invalidatesTags:['Workflows']
        }),

    })
})

export const{
    useGetWorkflowsQuery,
    useGetWorkflowQuery,
    useCreateWorkflowMutation,
    useUpdateWorkflowMutation,
    useDeleteWorkflowMutation,
    useActivateWorkflowMutation,
    useDeactivateWorkflowMutation,
    useTriggerWorkflowMutation,
    useGetIntegrationsQuery,
    useGetIntegrationQuery,
    useGetExecutionsQuery,
    useGetExecutionQuery,
    useGetCredentialsQuery,
    useCreateCredentialMutation,
    useDeleteCredentialMutation,
    useAddStepMutation,
    useUpdateStepMutation,
    useDeleteStepMutation,
    useReorderStepsMutation,
    useSyncWorkflowMutation,
    useGenerateWorkflowMutation
}=api