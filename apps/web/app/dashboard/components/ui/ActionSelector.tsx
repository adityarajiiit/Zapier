'use client'
import {useState} from 'react'
import {AnimatePresence} from 'framer-motion'
import {ArrowLeft,Search,X} from 'lucide-react'
import {useAppDispatch,useAppSelector} from '@/app/dashboard/store/hook'
import {closeActionSelector,addStep} from '@/app/dashboard/store/workflowBuilder'
import {useGetIntegrationsQuery,useGetIntegrationQuery} from '@/app/dashboard/store/api'

export function ActionSelector(){
    const dispatch=useAppDispatch()
    const isOpen=useAppSelector(s=>s.workflowBuilder.isActionSelectorOpen)
    const[search,setSearch]=useState('')
    const[selectedIntegrationId,setSelectedIntegrationId]=useState<string|null>(null)
    const{data:integrations=[]}=useGetIntegrationsQuery()
    const{data:integration}=useGetIntegrationQuery(selectedIntegrationId!,{
        skip:!selectedIntegrationId,
    })
    const filtered=integrations.filter(i=>i.name.toLowerCase().includes(search.toLowerCase()))
    const handleClose=()=>{
        dispatch(closeActionSelector())
        setSelectedIntegrationId(null)
        setSearch('')
    }
    if(!isOpen){
        return null
    }
    return(
        <dialog className="modal modal-open">
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
                       {selectedIntegrationId?`Choose an action for ${integration?.name}`:'Choose an action'}
                   </h3>
                   <button className="btn btn-ghost btn-sm btn-square" onClick={handleClose}>
                       <X className="h-4 w-4"/>
                   </button>
               </div>
               <AnimatePresence mode="wait">
                {!selectedIntegrationId?(
                    <div className="p-6">
                       <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/20 z-10"/>
                        <input
                        type="text"
                        placeholder="Search integrations"
                        value={search}
                        onChange={(e)=>setSearch(e.target.value)}
                        className="input input-bordered input-sm w-full pl-9"
                        />
                       </div>
                       <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                            {filtered.map(intg=>(
                                <button
                                key={intg.id}
                                onClick={()=>setSelectedIntegrationId(intg.id)}
                                className="p-4 rounded-xl bg-base-200 hover:bg-base-200/60 border border-transparent hover:border-white/10 cursor-pointer text-left"
                                >
                                <p className="text-sm font-medium text-base-content">{intg.name}</p>
                                <p className="text-xs text-base-content/40 mt-1">
                                {intg.actions?.length||0} actions
                                </p>
                                </button>
                            ))}
                       </div>
                    </div>
                ):(
                    <div className="p-6 max-h-96 overflow-y-auto">
                    {integration?.actions?.length===0&&(
                        <p className="text-sm text-base-content/40 text-center py-8">
                            No actions available for this integration
                        </p>
                    )}
                    <div className="flex flex-col gap-2">
                        {integration?.actions?.map(action=>(
                            <div
                            key={action.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-base-200 border border-transparent hover:border-white/10 transition-all"
                            >
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-base-content">
                                    {action.name}
                                </p>
                                {action.description&&(
                                    <p className="text-xs text-base-content/40 mt-0.5">
                                        {action.description}
                                    </p>
                                )}
                            </div>
                            <button
                            className="btn btn-primary btn-sm ml-4 shrink-0"
                            onClick={()=>{
                                dispatch(addStep({
                                    id:crypto.randomUUID(),
                                    integrationId:selectedIntegrationId!,
                                    actionId:action.id,
                                    credentialId:'',
                                    name:action.name,
                                    input:{},
                                    stepOrder:0
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
            <div className="modal-backdrop" onClick={handleClose}/>
        </dialog>
    )
}