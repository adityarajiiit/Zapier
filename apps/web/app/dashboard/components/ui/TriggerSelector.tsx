'use client'

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "../../store/hook"
import { useGetIntegrationQuery, useGetIntegrationsQuery } from "../../store/api"
import { closeTriggerSelector,setTrigger } from "../../store/workflowBuilder"
import { ArrowLeft,Search,X } from "lucide-react"
import { AnimatePresence,motion } from "framer-motion"

export function TriggerSelector(){
    const dispatch=useAppDispatch()
    const isOpen=useAppSelector(s=>s.workflowBuilder.isTriggerSelectorOpen)
    const[search,setSearch]=useState('')
    const[selectedIntegrationId,setSelectedIntegrationId]=useState<string|null>(null)
    const{
        data:integrations=[]
    }=useGetIntegrationsQuery()
    const {data:integration}=useGetIntegrationQuery(selectedIntegrationId!,{
        skip:!selectedIntegrationId
    })
    const filtered=integrations.filter(i=>i.name.toLowerCase().includes(search.toLowerCase()))
    const handleClose=()=>{
        dispatch(closeTriggerSelector())
        setSelectedIntegrationId(null)
        setSearch('')
    }
    if(!isOpen){
        return null
    }
    return(
        <dialog
        className="modal modal-open"
        >
        <div className="modal-box bg-base-300 max-w-2xl rounded-2xl border border-white/10 p-0 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
                 {selectedIntegrationId&&(
                    <button
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={()=>setSelectedIntegrationId(null)}
                    >
                    <ArrowLeft className="h-4 w-4"/>
                    </button>
                 )}
                <h3 className="text-base font-semibold text-base-content flex-1">
                     {selectedIntegrationId?`Choose a Trigger for ${integration?.name} integration`:`Choose a Trigger`}
                </h3>
                <button className="btn btn-ghost btn-sm btn-square" onClick={handleClose}>
                    <X className="h-4 w-4"/>
                </button>
            </div>
            <AnimatePresence mode="wait">
                {!selectedIntegrationId?(
                    <div
                    className="p-6"
                    >
                       <div className="relative mb-4">
                          <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40 z-10"
                          />
                          <input
                          type="text"
                          placeholder="Search integrations"
                          value={search}
                          onChange={(e)=>setSearch(e.target.value)}
                          className="input input-bordered input-sm w-full pl-9"
                          />
                       </div>
                       <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                          {filtered.map(i=>(
                              <button
                              key={i.id}
                              onClick={()=>setSelectedIntegrationId(i.id)}
                              className="p-4 rounded-xl bg-base-200 hover:bg-base-200/60 border border-transparent hover:border-white/10 cursor-pointer text-left"
                              >
                              <p className="text-sm font-medium text-base-content">{i.name}</p>
                              <p className="text-xs text-base-content/40 mt-1">
                                  {i.triggers?.length||0} triggers
                              </p>
                              </button>
                          ))}
                       </div>
                    </div>
                ):(
                    <div
                    className="p-6 max-h-96 overflow-y-auto"
                    >
                        {integration?.triggers?.length===0&&(
                            <p className="text-sm text-base-content/40 text-center py-8">
                                No triggers available.
                            </p>
                        )}
                        <div className="flex flex-col gap-2">
                            {integration?.triggers?.map(t=>(
                                <div
                                key={t.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-base-200 border border-transparent hover:border-white/10 transition-all"
                                >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-base-content">
                                        {t.name}
                                    </p>
                                    {t.description&&(
                                        <p className="text-xs text-base-content/40 mt-0.5">
                                            {t.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                className="btn btn-primary btn-sm ml-4 shrink-0"
                                onClick={()=>{
                                    dispatch(setTrigger({
                                        integrationId:selectedIntegrationId!,
                                        triggerId:t.id,
                                        credentialId:'',
                                        config:{}
                                    }))
                                    handleClose()
                                }}
                                >
                                    Select
                                </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
        <form method="dialog" className="modal-backdrop" onClick={handleClose}>
            <button>close</button>
        </form>
        </dialog>
    )
}