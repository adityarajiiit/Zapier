'use client'
import { useRouter } from 'next/navigation'
import { History, Play, Save } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/dashboard/store/hook'
import { markSaved,setWorkflowName } from '@/app/dashboard/store/workflowBuilder'
import { useUpdateWorkflowMutation, useTriggerWorkflowMutation, useSyncWorkflowMutation, useActivateWorkflowMutation, useDeactivateWorkflowMutation, useGetWorkflowQuery } from '@/app/dashboard/store/api'
import { toast } from 'sonner'

export function WorkflowHeader(){
    const router=useRouter()
    const dispatch=useAppDispatch()
    const{workflowId,workflowName,trigger,steps,unsaved}=useAppSelector(s=>s.workflowBuilder)
    const[updateWorkflow]=useUpdateWorkflowMutation()
    const[triggerWorkflow,{isLoading:isTriggering}]=useTriggerWorkflowMutation()
    const[syncWorkflow,{isLoading:isSaving}]=useSyncWorkflowMutation()
    const[activateWorkflow]=useActivateWorkflowMutation()
    const[deactivateWorkflow]=useDeactivateWorkflowMutation()

    const {data:workflow}=useGetWorkflowQuery(workflowId as string,{skip:!workflowId})

    const handleToggle=async()=>{
        if(!workflowId||!workflow){
            return
        }
        try{
            if(workflow.isActive){
                await deactivateWorkflow(workflowId).unwrap()
                toast.success('Workflow deactivated')
            }else{
                await activateWorkflow(workflowId).unwrap()
                toast.success('Workflow activated')
            }
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    }
    const handleSave=async()=>{
        if(!workflowId){
            return
        }
        try{
           await syncWorkflow({
            id:workflowId,
            trigger,
            steps
           }).unwrap()
           dispatch(markSaved())
           toast.success('Workflow saved')
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    }
    const handleTest=async()=>{
        if(!workflowId){
            return
        }
        try{
           await triggerWorkflow(workflowId).unwrap()
           toast.success('Workflow triggered')
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    }
    const handleName=async()=>{
        if(!workflowId||!workflowName.trim()){
            return
        }
        try{
            await updateWorkflow({
                id:workflowId,
                name:workflowName
            }).unwrap()
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    }
    return(
        <div className='sticky top-0 z-50 h-14 bg-base-200 border-b border-white/10 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 overflow-hidden'>
            <div className='flex items-center gap-2 flex-1 min-w-0'>
                <input
                type='text'
                value={workflowName}
                onChange={(e)=>dispatch(setWorkflowName(e.target.value))}
                onBlur={handleName}
                placeholder='Untitled Workflow'
                className='input input-ghost text-sm font-medium w-32 sm:w-56 focus:bg-base-300 min-w-0'
                />
                {unsaved&&(
                    <>
                        <span className='hidden sm:inline text-warning text-xs whitespace-nowrap'>Unsaved Changes</span>
                        <span className='sm:hidden h-2 w-2 rounded-full bg-warning shrink-0'/>
                    </>
                )}
            </div>
            <label className='flex items-center gap-1.5 cursor-pointer shrink-0'>
                <span className='hidden sm:inline text-xs text-base-content/40'>
                     Active
                </span>
                <input
                type='checkbox'
                className='toggle toggle-success toggle-sm'
                checked={workflow?.isActive || false}
                onChange={handleToggle}
                />
            </label>
            <button
            className='btn btn-ghost btn-sm gap-1.5 shrink-0'
            onClick={handleTest}
            disabled={isTriggering}
            >
            {isTriggering?<span className='loading loading-spinner loading-xs'/>:<Play className='h-4 w-4'/>}
            <span className='hidden sm:inline'>Run</span>
            </button>
            <button className='btn btn-primary btn-sm gap-1.5 shrink-0'
            onClick={handleSave}
            disabled={!unsaved||isSaving}
            suppressHydrationWarning
            >
            {isSaving?<span className='loading loading-spinner loading-xs'/>:<Save className='h-4 w-4'/>}
            <span className='hidden sm:inline'>Save</span>
            </button>
            <button className='hidden sm:flex btn btn-ghost btn-sm gap-1.5'
            onClick={()=>router.push(`/dashboard/workflows/${workflowId}/history`)}
            >
            <History className='h-4 w-4'/>
            History
            </button>
        </div>
    )
}
