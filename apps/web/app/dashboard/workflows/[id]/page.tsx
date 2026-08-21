'use client'
import {useParams} from 'next/navigation'
import {useEffect} from 'react'
import {useAppDispatch} from '../../store/hook'
import {useGetWorkflowQuery} from '../../store/api'
import {setWorkflow,resetBuilder} from '../../store/workflowBuilder'
import {WorkflowHeader} from '../../components/ui/Header'
import WorkflowCanvasLoader from '../../components/ui/WorkflowCanvasLoader'
import {TriggerSelector} from '../../components/ui/TriggerSelector'
import {ActionSelector} from '../../components/ui/ActionSelector'
import {StepConfigPanel} from '../../components/ui/StepConfigPanel'
import {TriggerConfigPanel} from '../../components/ui/TriggerConfigPanel'

export default function WorkflowBuilderPage(){
    const{id}=useParams<{id:string}>()
    const dispatch=useAppDispatch()
    const{data:workflow}=useGetWorkflowQuery(id)

    useEffect(()=>{
        if(workflow){
            dispatch(setWorkflow({
                workflowId:workflow.id,
                workflowName:workflow.name||'',
                trigger:workflow.trigger||null,
                steps:workflow.steps||[]
            }))
        }
    },[workflow,dispatch])

    useEffect(()=>{
        return()=>{
            dispatch(resetBuilder())
        }
    },[dispatch])

    return(
        <div className="h-screen overflow-hidden bg-base-100 flex flex-col">
            <WorkflowHeader/>
            <div className="flex-1 relative">
                <WorkflowCanvasLoader/>
            </div>
            <TriggerSelector/>
            <ActionSelector/>
            <StepConfigPanel/>
            <TriggerConfigPanel/>
        </div>
    )
}