'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Trash2, Settings2 } from 'lucide-react'
import { useAppDispatch } from '@/app/dashboard/store/hook'
import { removeStep, setSelectedStep, openConfigPanel } from '@/app/dashboard/store/workflowBuilder'
import type { BuilderStep } from '@/app/dashboard/store/workflowBuilder'

type StepNodeData={
    step:BuilderStep
    index:number
}
const color:Record<string,string>={
    ACTION:'border-info',
    CONDITION:'border-warning',
    FILTER:'border-error',
    DELAY:'border-neutral'
}
export function StepNode({data}:NodeProps){
    const dispatch=useAppDispatch()
    const{step,index}=data as StepNodeData
    const type = step.stepType || 'ACTION'
    return(
        <div className={`surface-card p-4 w-64 rounded-xl border-y border-r border-white/10 relative border-l-4 ${color[type]}`}>
          <Handle
          type="target"
          position={Position.Top}
          className='!bg-base-content/20 !border-base-content/10'
          />
          <div className='flex items-center gap-3'>
              <span className='badge badge-ghost badge-sm font-mono shrink-0'>
                {index+1}
              </span>
              <div className='min-w-0 flex-1'>
                <p className='text-xs text-base-content/40 uppercase'>
                    {type}
                </p>
                <p className='text-sm font-medium text-base-content truncate'>
                    {step.name}
                </p>
              </div>
          </div>
          <div className='flex gap-2 mt-3'>
             <button
             className='btn btn-ghost btn-xs flex-1 gap-1'
             onClick={()=>{
                dispatch(setSelectedStep(index))
                dispatch(openConfigPanel())
             }}
             >
            <Settings2 className='h-3 w-3'/>
                Configure
             </button>
             <button
             className='btn btn-ghost btn-xs text-error gap-1'
             onClick={()=>dispatch(removeStep(step.id))}
             >
             <Trash2 className='h-3 w-3'/>
                
             </button>
          </div>
           <Handle
           type='source'
           position={Position.Bottom}
           className='!bg-base-content/20 !border-base-content/10'
           />
        </div>
    )
}