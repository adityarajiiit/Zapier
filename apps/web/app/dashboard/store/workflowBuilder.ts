import { createSlice,PayloadAction } from "@reduxjs/toolkit";
import type { WorkflowTrigger,WorkflowStep } from "./api";

export interface BuilderStep{
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

export interface BuildTrigger{
    integrationId:string
    triggerId:string
    credentialId:string
    config:Record<string,any>
}

export interface WorkflowBuilderState{
    workflowId:string|null
    workflowName:string
    trigger:BuildTrigger|null
    steps:BuilderStep[]
    selectedStepIndex:number|null
    isTriggerSelectorOpen:boolean
    isActionSelectorOpen:boolean
    isConfigPanelOpen:boolean
    isTriggerConfigPanelOpen:boolean
    unsaved:boolean
}

const initialState:WorkflowBuilderState={
    workflowId:null,
    workflowName:'',
    trigger:null,
    steps:[],
    selectedStepIndex:null,
    isTriggerSelectorOpen:false,
    isActionSelectorOpen:false,
    isConfigPanelOpen:false,
    isTriggerConfigPanelOpen:false,
    unsaved:false
}

const workflowBuilderSlice=createSlice({
    name:"workflowBuilder",
    initialState,
    reducers:{
        setWorkflow(
            state,
            action:PayloadAction<{
                workflowId:string
                workflowName:string
                trigger:BuildTrigger|null
                steps:BuilderStep[]
            }>
        ){
            state.workflowId=action.payload.workflowId
            state.workflowName=action.payload.workflowName
            state.trigger=action.payload.trigger
            state.steps=action.payload.steps
            state.unsaved=false
        },
        setWorkflowName(state,action:PayloadAction<string>){
            state.workflowName=action.payload
        },
        setTrigger(state,action:PayloadAction<BuildTrigger>){
            state.trigger=action.payload
            state.unsaved=true
        },
        updateTriggerConfig(state,action:PayloadAction<{
            credentialId?:string
            config?:Record<string,any>
        }>){
            if(state.trigger){
                if(action.payload.credentialId!==undefined){
                    state.trigger.credentialId=action.payload.credentialId
                }
                if(action.payload.config!==undefined){
                    state.trigger.config=action.payload.config
                }
                state.unsaved=true
            }
        },
        addStep(state,action:PayloadAction<BuilderStep>){
            state.steps.push({
                ...action.payload,
                stepOrder:state.steps.length
            })
            state.unsaved=true
        },
        removeStep(state,action:PayloadAction<string>){
            state.steps=state.steps.filter((s)=>s.id!==action.payload).map((s,i)=>({...s,stepOrder:i}))
            if(state.selectedStepIndex!==null&&state.selectedStepIndex>state.steps.length){
                state.selectedStepIndex=state.steps.length>0?state.steps.length-1:null
            }
            state.unsaved=true
        },
        updateStepConfig(state,action:PayloadAction<{
            id:string
            patch:Partial<Omit<BuilderStep,"id"|"stepOrder">>
        }>
        ){
            const step=state.steps.find((s)=>s.id===action.payload.id)
            if(step){
                Object.assign(step,action.payload.patch)
                state.unsaved=true
            }
        },
        setStepType(state,action:PayloadAction<{id:string,stepType:'ACTION'|'CONDITION'|'FILTER'|'DELAY'}>){
            const step=state.steps.find((s)=>s.id===action.payload.id)
            if(step){
                step.stepType=action.payload.stepType
                state.unsaved=true
            }
        },
        moveStep(state,action:PayloadAction<{fromIndex:number,toIndex:number}>){
            const{fromIndex,toIndex}=action.payload
            const [moved]=state.steps.splice(fromIndex,1)
            state.steps.splice(toIndex,0,moved)
            state.steps=state.steps.map((s,i)=>({...s,stepOrder:i}))
            state.unsaved=true
        },
        setSelectedStep(state,action:PayloadAction<number|null>){
            state.selectedStepIndex=action.payload
        },
        openTriggerSelector(state){
            state.isTriggerSelectorOpen=true
        },
        closeTriggerSelector(state){
            state.isTriggerSelectorOpen=false
        },
        openActionSelector(state){
            state.isActionSelectorOpen=true
        },
        closeActionSelector(state){
            state.isActionSelectorOpen=false
        },
        openConfigPanel(state){
            state.isConfigPanelOpen=true
        },
        closeConfigPanel(state){
            state.isConfigPanelOpen=false
        },
        openTriggerConfigPanel(state){
            state.isTriggerConfigPanelOpen=true
        },
        closeTriggerConfigPanel(state){
            state.isTriggerConfigPanelOpen=false
        },
        markUnsaved(state){
            state.unsaved=true
        },
        markSaved(state){
            state.unsaved=false
        },
        resetBuilder(){
            return initialState
        }
    }
})

export const{
    setWorkflow,
    setWorkflowName,
    setTrigger,
    updateTriggerConfig,
    addStep,
    removeStep,
    updateStepConfig,
    moveStep,
    setSelectedStep,
    openTriggerSelector,
    closeTriggerSelector,
    openActionSelector,
    closeActionSelector,
    openConfigPanel,
    closeConfigPanel,
    openTriggerConfigPanel,
    closeTriggerConfigPanel,
    markUnsaved,
    markSaved,
    resetBuilder,
    setStepType
}=workflowBuilderSlice.actions

export const workflowBuilderReducer=workflowBuilderSlice.reducer