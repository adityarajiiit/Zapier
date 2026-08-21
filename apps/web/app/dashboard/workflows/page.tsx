'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {MoreVertical,Play,History,Pencil,Trash2,Zap,Sparkles} from 'lucide-react'
import {toast} from 'sonner'

import {TextGenerateEffect} from '@/components/ui/text-generate-effect'
import {ShimmerButton} from '@/components/ui/shimmer-button'
import {BackgroundGradient} from '@/components/ui/background-gradient'

import {useGetWorkflowsQuery,useActivateWorkflowMutation,useDeactivateWorkflowMutation,useDeleteWorkflowMutation,useTriggerWorkflowMutation,useGenerateWorkflowMutation} from '../store/api'
import {LoadingScreen} from '@/components/ui/loading-screen'
import {ErrorAlert} from '@/components/ui/error-alert'
import {AIWorkflowModal} from '../components/ui/AIWorkflowModal'

export default function WorkflowsPage(){
  const router=useRouter()
  const {data:workflows=[],isLoading,isError}=useGetWorkflowsQuery()
  const [activateWorkflow]=useActivateWorkflowMutation()
  const [deactivateWorkflow]=useDeactivateWorkflowMutation()
  const [deleteWorkflow,{isLoading:deleting}]=useDeleteWorkflowMutation()
  const [triggerWorkflow]=useTriggerWorkflowMutation()

  const [deleteModalOpen,setDeleteModalOpen]=useState(false)
  const [targetDeleteId,setTargetDeleteId]=useState<string|null>(null)
  const [aiModalOpen,setAiModalOpen]=useState(false)
  async function handleToggle(id:string,isActive:boolean){
    try{
      if(isActive){
        await deactivateWorkflow(id).unwrap()
        toast.success('Workflow deactivated')
      }
      else{
        await activateWorkflow(id).unwrap()
        toast.success('Workflow activated')
      }
    }
    catch(e:any){
      toast.error(e.data?.error)
    }
  }

  async function handleTrigger(id:string){
    try{
      await triggerWorkflow(id).unwrap()
      toast.success('Workflow triggered')
    }
    catch(e:any){
      toast.error(e.data?.error)
    }
  }

  async function handleDelete(){
    if(!targetDeleteId) return
    try{
      await deleteWorkflow(targetDeleteId).unwrap()
      toast.success('Workflow deleted')
      setDeleteModalOpen(false)
      setTargetDeleteId(null)
    }
    catch(e:any){
      toast.error(e.data?.error)
    }
  }

  function openDelete(id:string){
    setTargetDeleteId(id)
    setDeleteModalOpen(true)
  }

  if(isLoading)return <LoadingScreen />
  if(isError)return <ErrorAlert />

  if(workflows.length===0){
    return(
      <div className="flex min-h-screen items-center justify-center bg-base-100 p-8">
        <BackgroundGradient className="rounded-2xl p-px">
          <div className="rounded-2xl border border-white/[0.06] bg-base-200 p-12 text-center max-w-md">
            <Zap className="mx-auto h-10 w-10 text-base-content/20 mb-4"/>
            <h2 className="text-xl font-bold text-base-content">
              No workflows yet
            </h2>
            <p className="mt-2 text-sm text-base-content/50">
              Create your first workflow to get started
            </p>
            <div className="mt-6 flex justify-center">
              <ShimmerButton className="px-6 py-2 text-sm font-semibold" onClick={()=>router.push('/dashboard/workflows/new')}>
                Create Workflow
              </ShimmerButton>
            </div>
          </div>
        </BackgroundGradient>
      </div>
    )
  }

  return(
    <div className="relative min-h-screen bg-base-100 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <TextGenerateEffect words="Workflows" className="text-3xl font-bold tracking-tight text-base-content lg:text-4xl"/>
            <p className="mt-2 text-sm text-base-content/50">
              Build and manage your automations
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-outline btn-sm gap-1.5"
              onClick={()=>setAiModalOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5"/>
              Generate with AI
            </button>
            <ShimmerButton className="px-4 py-2 text-sm font-semibold" onClick={()=>router.push('/dashboard/workflows/new')}>
              Create Workflow
            </ShimmerButton>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf)=>(
            <div 
              key={wf.id} 
              className="rounded-xl border border-white/[0.06] bg-base-200 p-5 flex flex-col gap-4 hover:border-white/[0.12] transition-colors duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-base-content truncate">
                    {wf.name}
                  </p>
                  {wf.description&&(
                    <p className="mt-1 text-xs text-base-content/40 line-clamp-2">
                      {wf.description}
                    </p>
                  )}
                </div>
                <div className="dropdown dropdown-end shrink-0 ml-2">
                  <button tabIndex={0} className="btn btn-ghost btn-xs btn-square">
                    <MoreVertical className="h-4 w-4"/>
                  </button>
                  <ul tabIndex={0} className="dropdown-content menu bg-base-300 rounded-xl border border-white/[0.06] z-50 w-40 p-1 shadow-lg">
                    <li>
                      <button className="flex items-center gap-2 text-sm" onClick={()=>router.push(`/dashboard/workflows/${wf.id}`)}>
                        <Pencil className="h-3.5 w-3.5"/>Edit
                      </button>
                    </li>
                    <li>
                      <button className="flex items-center gap-2 text-sm" onClick={()=>handleTrigger(wf.id)}>
                        <Play className="h-3.5 w-3.5"/>
                        Run now
                      </button>
                    </li>
                    <li>
                      <button className="flex items-center gap-2 text-sm" onClick={()=>router.push(`/dashboard/workflows/${wf.id}/history`)}>
                        <History className="h-3.5 w-3.5"/>
                        History
                      </button>
                    </li>
                    <li>
                      <button className="flex items-center gap-2 text-sm text-error" onClick={()=>openDelete(wf.id)}>
                        <Trash2 className="h-3.5 w-3.5"/>
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="badge badge-ghost badge-sm">
                  {wf.steps?.length||0} steps
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-base-content/40">
                    {wf.isActive?'Active':'Inactive'}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-sm"
                    checked={wf.isActive}
                    onChange={()=>handleToggle(wf.id,wf.isActive)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <dialog className={`modal modal-middle ${deleteModalOpen?'modal-open':''}`}>
        <div className="modal-box max-w-sm rounded-2xl border border-white/10 bg-base-300">
          <h3 className="text-base font-semibold text-base-content">
            Delete Workflow
          </h3>
          <p className="mt-3 text-sm text-base-content/50">
            This will permanently delete the workflow and all its execution history.
          </p>
          <div className="modal-action mt-6">
            <button className="btn btn-ghost btn-sm" onClick={()=>setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-error btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting?<span className="loading loading-spinner loading-xs"/>:null}
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop" onClick={()=>setDeleteModalOpen(false)}>
          <button>close</button>
        </form>
      </dialog>
      <AIWorkflowModal isOpen={aiModalOpen} onClose={()=>setAiModalOpen(false)}/>
    </div>
  )
}