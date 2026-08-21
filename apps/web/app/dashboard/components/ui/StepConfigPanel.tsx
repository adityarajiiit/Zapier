'use client'
import { useState,useEffect,useRef } from "react"
import{X} from 'lucide-react'
import { useAppDispatch,useAppSelector } from "../../store/hook"
import { closeConfigPanel,updateStepConfig } from "../../store/workflowBuilder"
import { useGetCredentialsQuery,useGetIntegrationQuery, useGetIntegrationsQuery } from "../../store/api"
import{DataMap} from"./DataMap"

export function StepConfigPanel(){
    const dispatch=useAppDispatch()
    const{isConfigPanelOpen,selectedStepIndex,steps}=useAppSelector(s=>s.workflowBuilder)
    const[credentialId,setCredentialId]=useState('')
    const[input,setInput]=useState<Record<string,any>>({})
    const[conditionConfig,setConditionConfig]=useState<any>({})
    const[errorConfig,setErrorConfig]=useState<any>({})
    const{data:credentials=[]}=useGetCredentialsQuery()
    const step=selectedStepIndex!==null?steps[selectedStepIndex]:null
    const{data:integration}=useGetIntegrationQuery(step?.integrationId!,{
        skip:!step?.integrationId
    })
    const trigger=useAppSelector(s=>s.workflowBuilder.trigger)
    const {data:triggerIntegration}=useGetIntegrationQuery(trigger?.integrationId!,{
        skip:!trigger?.integrationId
    })
    const triggerDef=triggerIntegration?.triggers?.find(t=>t.id===trigger?.triggerId)
    const triggerOutputSchema=triggerDef?.outputSchema||{}
    const filtered=credentials.filter(c=>c.integrationId===step?.integrationId)
    const action=integration?.actions?.find(a=>a.id===step?.actionId)
    const inputSchema=action?.inputSchema||{}
    const{data:allIntegrations=[]}=useGetIntegrationsQuery()
    useEffect(()=>{
        if(step){
            setCredentialId(step.credentialId||'')
            setInput(step.input||{})
            setConditionConfig(step.conditionConfig||{})
            setErrorConfig(step.errorConfig||{})
        }
    },[step])
    const handleSave=()=>{
        if(!step){
            return
        }
        dispatch(updateStepConfig({
            id:step.id,
            patch:{credentialId,input,conditionConfig,errorConfig}
        }))
        dispatch(closeConfigPanel())
    }
    const prevStepSchemas=steps.slice(0,selectedStepIndex||0).map((s,i)=>{
        const integration=allIntegrations.find(ig=>ig.id===s.integrationId)
        const action=integration?.actions?.find(a=>a.id===s.actionId)
        return{
            stepName:s.name,
            stepIndex:i,
            outputSchema:action?.outputSchema||{}
        }
    })
    const inputRefs=useRef<any>({})
    const insertVariable=(key:string,variable:string)=>{
        const el=inputRefs.current[key]
        if(!el){
            setInput(prev=>({
                ...prev,
                [key]:String(prev[key]||'')+variable
            }))
            return
        }
        const start=el.selectionStart||el.value.length
        const end=el.selectionEnd||el.value.length
        const newVal=el.value.slice(0,start)+variable+el.value.slice(end)
        setInput(prev=>({
            ...prev,
            [key]:newVal
        }))
        el.focus()
        el.setSelectionRange(start+variable.length,start+variable.length)
    }
    const insertConditionVariable=(key:string,variable:string)=>{
        const el=inputRefs.current['condition_'+key]
        if(!el){
            setConditionConfig((prev:any)=>({
                ...prev,
                [key]:String(prev?.[key]||'')+variable
            }))
            return
        }
        const start=el.selectionStart||el.value.length
        const end=el.selectionEnd||el.value.length
        const newVal=el.value.slice(0,start)+variable+el.value.slice(end)
        setConditionConfig((prev:any)=>({
            ...prev,
            [key]:newVal
        }))
        el.focus()
        el.setSelectionRange(start+variable.length,start+variable.length)
    }
    if(!isConfigPanelOpen||!step){
        return null
    }
    return(
        <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:top-14 sm:bottom-0 sm:right-0 top-auto z-50 flex flex-col sm:flex-row">
            <div className="w-full sm:w-[420px] max-h-[85vh] sm:max-h-none bg-base-300 border-t sm:border-t-0 sm:border-l border-white/10 flex flex-col overflow-hidden overscroll-contain rounded-t-2xl sm:rounded-none">
               <div className="flex items-center  gap-3 px-6 py-4 border-b border-white/10 shrink-0">
                <h3 className="text-base font-semibold text-base-content flex-1">
                    Configure Step
                </h3>
                <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={()=>dispatch(closeConfigPanel())}
                >
                    <X className="h-4 w-4"/>
                </button>
               </div>
               <div className="flex-1 overflow-y-auto overscroll-contain p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase text-base-content/40">
                       Step Name
                    </label>
                    <p className="text-sm font-medium text-base-content">
                       {step.name}
                    </p>
                </div>
                <div className="flex flex-col gap-2 mt-4 border-b border-white/10 pb-4">
                    <label className="text-xs uppercase text-base-content/40">
                        Step Type
                    </label>
                    <select
                     className="select select-bordered select-sm w-full"
                    onChange={(e)=>{
                        dispatch(updateStepConfig({
                            id:step.id,
                            patch:{
                                stepType:e.target.value as any
                            }
                        }))
                    }}
                    value={step.stepType||'ACTION'}
                    >
                        <option value="ACTION">Action</option>
                        <option value="CONDITION">Condition</option>
                        <option value="FILTER">Filter</option>
                        <option value="DELAY">Delay</option>
                    </select>
                </div>
                {(!step.stepType||step.stepType==='ACTION')&&(
                    <>
                        {filtered.length>0&&(
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase text-base-content/40">
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
                )}
                {Object.entries(inputSchema).map(([key,schema]:any)=>{
                    const isRequired=input[key]==='{{required}}'
                    return(
                    <div className="flex flex-col gap-1.5" key={key}>
                        <div className="flex items-center justify-between">
                            <label className={`text-xs uppercase ${isRequired?'text-red-800':'text-base-content/40'}`}>
                                {key}
                            </label>
                            <DataMap
                                onInsert={(v)=>insertVariable(key,v)}
                                triggerOutputSchema={triggerOutputSchema}
                                stepOutputSchemas={prevStepSchemas}
                            />
                        </div>
                        {schema?.type==='text'||schema?.type==='string'?(
                            <textarea
                            ref={el=>{inputRefs.current[key]=el}}
                            rows={3}
                            placeholder={schema?.description||"Write here"}
                            value={input[key]||''}
                            onChange={(e)=>setInput(prev=>({
                                ...prev,
                                [key]:e.target.value
                            }))}
                            className={`textarea textarea-sm w-full resize-none border ${isRequired?'border-red-800 bg-red-800/10':'textarea-bordered'}`}
                            />
                        ):(
                            <input
                            ref={el=>{inputRefs.current[key]=el}}
                            type="text"
                            placeholder={schema?.description||"Write here"}
                            value={input[key]||''}
                            onChange={(e)=>setInput(prev=>({
                                ...prev,
                                [key]:e.target.value
                            }))}
                            className={`input input-sm w-full border ${isRequired?'border-red-800 bg-red-800/10':'input-bordered'}`}
                            />
                        )}
                        {isRequired&&(
                            <p className="text-xs text-red-800 mt-0.5">This field requires your input</p>
                        )}
                    </div>
                    )
                })}
                </>
                )}
                {(step.stepType==='CONDITION'||step.stepType==='FILTER')&&(
                    <div className="flex flex-col gap-4 mt-4 border-t border-white/10 pt-4">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs uppercase text-base-content/40">Field</label>
                                <DataMap
                                    onInsert={(v)=>insertConditionVariable('field',v)}
                                    triggerOutputSchema={triggerOutputSchema}
                                    stepOutputSchemas={prevStepSchemas}
                                />
                            </div>
                            <input
                                ref={el=>{inputRefs.current['condition_field']=el}}
                                type="text"
                                placeholder="{{trigger.data.field}}"
                                value={conditionConfig?.field||''}
                                onChange={(e)=>setConditionConfig((prev:any)=>({...prev,field:e.target.value}))}
                                className="input input-bordered input-sm w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs uppercase text-base-content/40">Operator</label>
                            <select
                                className="select select-bordered select-sm w-full"
                                value={conditionConfig?.operator||'equals'}
                                onChange={(e)=>setConditionConfig((prev:any)=>({...prev,operator:e.target.value}))}
                            >
                                <option value="equals">Equals</option>
                                <option value="not-equal">Not Equals</option>
                                <option value="contains">Contains</option>
                                <option value="not-contains">Not Contains</option>
                                <option value="greater-than">Greater Than</option>
                                <option value="less-than">Less Than</option>
                                <option value="is-empty">Is Empty</option>
                                <option value="is-not-empty">Is Not Empty</option>
                            </select>
                        </div>
                        {conditionConfig?.operator!=='is-empty'&&conditionConfig?.operator!=='is-not-empty'&&(
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs uppercase text-base-content/40">Value</label>
                                    <DataMap
                                        onInsert={(v)=>insertConditionVariable('value',v)}
                                        triggerOutputSchema={triggerOutputSchema}
                                        stepOutputSchemas={prevStepSchemas}
                                    />
                                </div>
                                <input
                                    ref={el=>{inputRefs.current['condition_value']=el}}
                                    type="text"
                                    placeholder="Value"
                                    value={conditionConfig?.value||''}
                                    onChange={(e)=>setConditionConfig((prev:any)=>({...prev,value:e.target.value}))}
                                    className="input input-bordered input-sm w-full"
                                />
                            </div>
                        )}
                    </div>
                )}
                {step.stepType==='DELAY'&&(
                    <div className="flex flex-col gap-4 mt-4 border-t border-white/10 pt-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs uppercase text-base-content/40">Delay (ms)</label>
                            <input
                                type="number"
                                placeholder="5000"
                                value={input?.delayMs||''}
                                onChange={(e)=>setInput((prev:any)=>({...prev,delayMs:Number(e.target.value)}))}
                                className="input input-bordered input-sm w-full"
                            />
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-4 border-t border-white/10 pt-4 mt-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs uppercase text-base-content/40">On Error</label>
                        <select
                            className="select select-bordered select-sm w-full"
                            value={errorConfig?.onError||'stop'}
                            onChange={(e)=>setErrorConfig((prev:any)=>({...prev,onError:e.target.value}))}
                        >
                            <option value="stop">Stop</option>
                            <option value="continue">Continue</option>
                            <option value="retry">Retry</option>
                        </select>
                    </div>
                    {errorConfig?.onError==='retry'&&(
                        <>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase text-base-content/40">Max Attempts</label>
                                <input
                                    type="number"
                                    placeholder="3"
                                    value={errorConfig?.retryConfig?.maxAttempts||3}
                                    onChange={(e)=>setErrorConfig((prev:any)=>({...prev,retryConfig:{...prev?.retryConfig,maxAttempts:Number(e.target.value)}}))}
                                    className="input input-bordered input-sm w-full"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase text-base-content/40">Backoff</label>
                                <input
                                    type="number"
                                    placeholder="1000"
                                    value={errorConfig?.retryConfig?.backoffMs||1000}
                                    onChange={(e)=>setErrorConfig((prev:any)=>({...prev,retryConfig:{...prev?.retryConfig,backoffMs:Number(e.target.value)}}))}
                                    className="input input-bordered input-sm w-full"
                                />
                            </div>
                        </>
                    )}
                </div>
               </div>
               <div className="flex gap-2 px-6 py-4 border-t border-white/10 shrink-0">
                  <button
                  className="btn btn-ghost btn-sm flex-1"
                  onClick={()=>dispatch(closeConfigPanel())}
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
            onClick={()=>dispatch(closeConfigPanel())}
            ></div>
        </div>
    )
}