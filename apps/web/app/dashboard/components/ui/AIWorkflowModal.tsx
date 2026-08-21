'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Sparkles} from 'lucide-react'
import {toast} from 'sonner'
import {useGenerateWorkflowMutation,useGetWorkflowQuery,useUpdateStepMutation,RequiredField} from '../../store/api'

interface Props{
    isOpen:boolean
    onClose:()=>void
}

export function AIWorkflowModal({isOpen,onClose}:Props){
    const router=useRouter()
    const [phase,setPhase]=useState<'prompt'|'fields'>('prompt')
    const [prompt,setPrompt]=useState('')
    const [workflowId,setWorkflowId]=useState<string|null>(null)
    const [requiredFields,setRequiredFields]=useState<RequiredField[]>([])
    const [fieldValues,setFieldValues]=useState<Record<string,string>>({})
    const [generateWorkflow,{isLoading}]=useGenerateWorkflowMutation()
    const [updateStep,{isLoading:saving}]=useUpdateStepMutation()
    const {data:workflow}=useGetWorkflowQuery(workflowId!,{skip:!workflowId})
    async function handleGenerate(){
        if(!prompt.trim()){
            return
        }
        try{
            const result=await generateWorkflow({prompt}).unwrap()
            setWorkflowId(result.workflowId)
            setRequiredFields(result.requiredFields)
            if(result.requiredFields.length===0){
                router.push(`/dashboard/workflows/${result.workflowId}`)
                handleClose()
            }
            else{
                setPhase('fields')
            }
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    }

    async function handleOpen(){
        if(!workflowId||!workflow){
            return
        }
        try{
            const stepIds=[...new Set(requiredFields.map(f=>f.stepId))]
            await Promise.all(stepIds.map(stepId=>{
                const step=workflow.steps?.find(s=>s.id===stepId)
                if(!step) return
                const patch=Object.fromEntries(
                    requiredFields
                        .filter(f=>f.stepId===stepId&&fieldValues[`${f.stepId}-${f.fieldKey}`]?.trim())
                        .map(f=>[f.fieldKey,fieldValues[`${f.stepId}-${f.fieldKey}`]])
                )
                return updateStep({workflowId,stepId,input:{...step.input,...patch}}).unwrap()
            }))
            router.push(`/dashboard/workflows/${workflowId}`)
            handleClose()
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    }
    function handleClose(){
        setPhase('prompt')
        setPrompt('')
        setWorkflowId(null)
        setRequiredFields([])
        setFieldValues({})
        onClose()
    }
    const stepGroups=[...new Map(requiredFields.map(f=>[f.stepId,f])).values()]
    return(
        <dialog className={`modal modal-middle ${isOpen?'modal-open':''}`}>
            <div className="modal-box max-w-md rounded-2xl border border-white/10 bg-base-300">
                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-5 w-5 text-primary"/>
                    <h3 className="text-base font-semibold text-base-content">
                        {phase==='prompt'?'Generate Workflow with AI':'Almost ready!'}
                    </h3>
                </div>
                {phase==='prompt'?(
                    <>
                        <p className="text-xs text-base-content/50 mb-3">
                            Describe your automation in plain English mention the apps and what should happen.
                        </p>
                        <textarea
                            rows={4}
                            className="textarea textarea-bordered w-full resize-none text-sm"
                            placeholder="Write your automation workflow here"
                            value={prompt}
                            disabled={isLoading}
                            onChange={e=>setPrompt(e.target.value)}
                        />
                        <div className="modal-action mt-5">
                            <button className="btn btn-ghost btn-sm" onClick={handleClose} disabled={isLoading}>Cancel</button>
                            <button className="btn btn-primary btn-sm gap-1.5" onClick={handleGenerate} disabled={isLoading||!prompt.trim()}>
                                {isLoading&&<span className="loading loading-spinner loading-xs"/>}
                                {isLoading?'Generating...':'Generate →'}
                            </button>
                        </div>
                    </>
                ):(
                    <>
                        <p className="text-xs text-base-content/50 mb-4">Fill in these required values before opening your workflow.</p>
                        <div className="flex flex-col gap-5 max-h-72 overflow-y-auto pr-1">
                            {stepGroups.map(group=>{
                                const fields=requiredFields.filter(f=>f.stepId===group.stepId)
                                return(
                                    <div key={group.stepId} className="flex flex-col gap-3">
                                        <p className="text-xs font-semibold text-base-content/60 uppercase border-b border-white/10 pb-1">
                                            {group.stepName}
                                        </p>
                                        {fields.map(f=>(
                                            <div key={f.fieldKey} className="flex flex-col gap-1">
                                                <label className="text-xs text-base-content/50 uppercase">{f.fieldLabel}</label>
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm w-full"
                                                    placeholder={`Enter ${f.fieldLabel}`}
                                                    value={fieldValues[`${f.stepId}-${f.fieldKey}`]||''}
                                                    onChange={e=>setFieldValues(prev=>({...prev,[`${f.stepId}-${f.fieldKey}`]:e.target.value}))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                        <div className="modal-action mt-6">
                            <button className="btn btn-ghost btn-sm" onClick={()=>setPhase('prompt')} disabled={saving}>Back</button>
                            <button className="btn btn-primary btn-sm gap-1.5" onClick={handleOpen} disabled={saving}>
                                {saving&&<span className="loading loading-spinner loading-xs"/>}
                                Open Workflow
                            </button>
                        </div>
                    </>
                )}
            </div>
            <form method="dialog" className="modal-backdrop" onClick={handleClose}>
                <button>close</button>
            </form>
        </dialog>
    )
}
