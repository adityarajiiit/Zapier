'use client'
import { useState,useEffect } from "react"
import{X} from 'lucide-react'
import { useAppDispatch,useAppSelector } from "../../store/hook"
import { closeTriggerConfigPanel,updateTriggerConfig } from "../../store/workflowBuilder"
import { useGetCredentialsQuery } from "../../store/api"

export function TriggerConfigPanel(){
    const dispatch=useAppDispatch()
    const{isTriggerConfigPanelOpen,trigger}=useAppSelector(s=>s.workflowBuilder)
    const[credentialId,setCredentialId]=useState('')
    const[config,setConfig]=useState<Record<string,any>>({})
    const{data:credentials=[]}=useGetCredentialsQuery()

    const filtered=credentials.filter(c=>c.integrationId===trigger?.integrationId)

    useEffect(()=>{
        if(trigger){
            setCredentialId(trigger.credentialId||'')
            setConfig(trigger.config||{})
        }
    },[trigger])

    const handleSave=()=>{
        if(!trigger){
            return
        }
        dispatch(updateTriggerConfig({
            credentialId,
            config
        }))
        dispatch(closeTriggerConfigPanel())
    }

    if(!isTriggerConfigPanelOpen||!trigger){
        return null
    }
    return(
        <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:top-14 sm:bottom-0 sm:right-0 top-auto z-50 flex flex-col sm:flex-row">
            <div className="w-full sm:w-[420px] max-h-[85vh] sm:max-h-none bg-base-300 border-t sm:border-t-0 sm:border-l border-white/10 flex flex-col overflow-hidden overscroll-contain rounded-t-2xl sm:rounded-none">
               <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 shrink-0">
                <h3 className="text-base font-semibold text-base-content flex-1">
                    Configure Trigger
                </h3>
                <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={()=>dispatch(closeTriggerConfigPanel())}
                >
                    <X className="h-4 w-4"/>
                </button>
               </div>
               <div className="flex-1 overflow-y-auto overscroll-contain p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest text-base-content/40">
                       Trigger Name
                    </label>
                    <p className="text-sm font-medium text-base-content">
                       {trigger.triggerId}
                    </p>
                </div>
                {filtered.length>0?(
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-widest text-base-content/40">
                            Credential
                        </label>
                        <select
                        className="select select-bordered select-sm w-full"
                        value={credentialId}
                        onChange={(e)=>setCredentialId(e.target.value)}
                        >
                        <option
                        value=''
                        >
                        Select a Credential
                        </option>
                        {filtered.map((c)=>(<option key={c.id} value={c.id}>
                            {c.label}
                        </option>
                        ))}
                        </select>
                    </div>
                ):(
                    <div className="alert alert-warning text-sm">
                        No credentials found for this integration. Please add one first.
                    </div>
                )}
                {trigger.integrationId==='github'&&(
                    <div className="flex flex-col gap-2 border-t border-white/10 pt-4 mt-2">
                        <label className="text-xs uppercase tracking-widest text-base-content/40">
                            Owner
                        </label>
                        <input
                            type="text"
                            placeholder="facebook"
                            value={config.owner||''}
                            onChange={(e)=>setConfig(prev=>({...prev,owner:e.target.value}))}
                            className="input input-bordered input-sm w-full"
                        />
                        <label className="text-xs uppercase tracking-widest text-base-content/40 mt-2">
                            Repository
                        </label>
                        <input
                            type="text"
                            placeholder="react"
                            value={config.repo||''}
                            onChange={(e)=>setConfig(prev=>({...prev,repo:e.target.value}))}
                            className="input input-bordered input-sm w-full"
                        />
                    </div>
                )}
               </div>
               <div className="flex gap-2 px-6 py-4 border-t border-white/10 shrink-0">
                  <button
                  className="btn btn-ghost btn-sm flex-1"
                  onClick={()=>dispatch(closeTriggerConfigPanel())}
                  >
                    Cancel
                  </button>
                  <button
                  className="btn btn-primary btn-sm flex-1"
                  onClick={handleSave}
                  >
                    Save
                  </button>
               </div>
            </div>
            <div
            className="hidden sm:block flex-1 bg-black/40"
            onClick={()=>dispatch(closeTriggerConfigPanel())}
            ></div>
        </div>
    )
}
