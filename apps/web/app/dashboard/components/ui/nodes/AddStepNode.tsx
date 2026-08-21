'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useAppDispatch } from '@/app/dashboard/store/hook'
import { openActionSelector,addStep } from '@/app/dashboard/store/workflowBuilder'
import { useState } from 'react'

export function AddStepNode({data}:NodeProps){
    const[showPicker,setShowPicker]=useState(false)
    const handleSelect=(type:string)=>{
        if(type==='ACTION'){
            dispatch(openActionSelector())
        }
        else{
            dispatch(addStep({
                id:crypto.randomUUID(),
                integrationId:'',
                actionId:'',
                credentialId:'',
                name:`New ${type}`,
                input:{},
                stepOrder:0,
                stepType:type as any
            }))
        }
        setShowPicker(false)
    }
    const dispatch=useAppDispatch()
    return(
    <div className='flex flex-col items-center relative'>
        <Handle type='target' position={Position.Top} className='!bg-base-content/20 !border-base-content/10'/>
        <motion.button
            whileHover={{scale:1.1}}transition={{duration:0.20}}
            onClick={()=>setShowPicker(!showPicker)}
            className='h-12 w-12 rounded-full border-2 border-dashed border-white/20 
            bg-base-200 flex items-center justify-center hover:border-white/30 hover:bg-base-300'
        >
            <Plus className='h-5 w-5 text-base-content/40'/>
        </motion.button>
        {showPicker&&(
            <div className="absolute top-14 bg-base-300 border border-white/10 rounded-xl p-2 z-20 flex flex-col gap-1 w-32 shadow-xl">
                {['ACTION','CONDITION','FILTER','DELAY'].map(t=>
                    (<button key={t} onClick={()=>handleSelect(t)} 
                    className="text-left text-sm font-medium p-2 hover:bg-base-200 rounded-lg">
                    {t}
                    </button>))}
            </div>
        )}
    </div>
)

}