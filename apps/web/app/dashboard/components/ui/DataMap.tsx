'use client'

import{useState,useEffect,useRef} from 'react'
import{Braces} from 'lucide-react'

interface StepSchema{
    stepName:string
    stepIndex:number
    outputSchema:Record<string,any>
}

interface Data{
    onInsert:(variable:string)=>void
    triggerOutputSchema?:Record<string,any>
    stepOutputSchemas:StepSchema[]
}

export function DataMap({onInsert,triggerOutputSchema={},stepOutputSchemas}:Data){
    const[open,setOpen]=useState(false)
    const containerRef=useRef<HTMLDivElement>(null)
    useEffect(()=>{
        if(!open){
            return
        }
        const handler=(e:MouseEvent)=>{
            if(!containerRef.current?.contains(e.target as Node)){
                setOpen(false)
            }
        }
        document.addEventListener('mousedown',handler)
        return()=>document.removeEventListener('mousedown',handler)
    },[open])

    const triggerProps = triggerOutputSchema.properties || triggerOutputSchema
    const triggerKeys = Object.keys(triggerProps)
    const hasAnything = triggerKeys.length > 0 || stepOutputSchemas.some(s => Object.keys(s.outputSchema.properties || s.outputSchema).length > 0)
    return (
        <div ref={containerRef} className='relative'>
            <button
            type='button'
            className='btn btn-ghost btn-xs btn-square'
            title="Insert variable"
            onClick={()=>setOpen(prev=>!prev)}
            >
                <Braces className='h-3 w-3'/>
            </button>
            {open&&(
                <div className='absolute right-0 top-full mt-1 z-50 bg-base-300 border border-white/10 rounded-xl w-72 max-h-80 overflow-y-auto shadow-xl'>
                    {!hasAnything?(
                        <p className='text-xs text-base-content/40 text-center py-6 px-4'>
                            No output data available
                        </p>
                    ):(
                        <div className='p-2 flex flex-col gap-1'>
                            {triggerKeys.length>0&&(
                                <details open className='collapse collapse-arrow bg-base-200 rounded-lg'>
                                    <summary className='collapse-title text-xs font-semibold text-base-content/60 uppercase min-h-0 py-2 px-3'>
                                        Trigger Data
                                    </summary>
                                    <div className='collapse-content pb-1 px-1'>
                                        {triggerKeys.map(field=>(
                                            <button
                                            type='button'
                                            key={field}
                                            onClick={()=>{onInsert(`{{trigger.${field}}}`);setOpen(false)}}
                                            className='w-full text-left px-3 py-1.5 text-xs font-mono text-base-content/50 hover:text-base-content hover:bg-white/5 rounded transition-colors'
                                            >
                                                {`{{trigger.${field}}}`}
                                            </button>
                                        ))}
                                    </div>
                                </details>
                            )}
                            {stepOutputSchemas.map(({stepName,stepIndex,outputSchema})=>{
                                const stepProps = outputSchema.properties || outputSchema
                                const keys = Object.keys(stepProps)
                                if(keys.length===0){
                                    return null
                                }
                                return(
                                    <details key={stepIndex} className="collapse collapse-arrow bg-base-200 rounded-lg">
                                        <summary
                                        className='collapse-title text-xs font-semibold text-base-content/60 uppercase min-h-0
                                        py-2 px-3
                                        '
                                        >
                                        Step {stepIndex+1}
                                        </summary>
                                        <div className='collapse-content pb-1 px-1'>
                                            {keys.map(field=>(
                                                <button
                                                type='button'
                                                key={field}
                                                onClick={()=>{onInsert(`{{step${stepIndex}.${field}}}`);setOpen(false)}}
                                                className='w-full text-left px-3 py-1.5 text-xs font-mono text-base-content/50 hover:text-base-content hover:bg-white/5 rounded transition-colors'
                                                >
                                                    {`{{step${stepIndex}.${field}}}`}
                                                </button>
                                            ))}
                                        </div>
                                    </details>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

        </div>
    )
    
    
}